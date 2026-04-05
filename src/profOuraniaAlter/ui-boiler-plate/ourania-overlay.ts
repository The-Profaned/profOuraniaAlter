import { MainStates, state } from '../State Manager/script-state.js';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */

const PURE_ESSENCE_ID = net.runelite.api.ItemID.PURE_ESSENCE;
const DAEYALT_ESSENCE_ID = net.runelite.api.ItemID.DAEYALT_ESSENCE;
const OVERLAY_WIDTH = 360;
const TRACKED_RUNE_ITEM_IDS: number[] = [
	net.runelite.api.ItemID.AIR_RUNE,
	net.runelite.api.ItemID.WATER_RUNE,
	net.runelite.api.ItemID.EARTH_RUNE,
	net.runelite.api.ItemID.FIRE_RUNE,
	net.runelite.api.ItemID.MIND_RUNE,
	net.runelite.api.ItemID.BODY_RUNE,
	net.runelite.api.ItemID.COSMIC_RUNE,
	net.runelite.api.ItemID.CHAOS_RUNE,
	net.runelite.api.ItemID.NATURE_RUNE,
	net.runelite.api.ItemID.LAW_RUNE,
	net.runelite.api.ItemID.DEATH_RUNE,
	net.runelite.api.ItemID.ASTRAL_RUNE,
	net.runelite.api.ItemID.BLOOD_RUNE,
	net.runelite.api.ItemID.SOUL_RUNE,
	net.runelite.api.ItemID.WRATH_RUNE,
	net.runelite.api.ItemID.MIST_RUNE,
	net.runelite.api.ItemID.DUST_RUNE,
	net.runelite.api.ItemID.MUD_RUNE,
	net.runelite.api.ItemID.SMOKE_RUNE,
	net.runelite.api.ItemID.STEAM_RUNE,
	net.runelite.api.ItemID.LAVA_RUNE,
];

let botMakerMainOverlayReference: unknown = null;
let craftedRunesBaselineTotal = -1;
let essenceBaselineTotal = -1;

const overlay = {
	manager: (
		net.runelite.client.RuneLite.getInjector() as unknown as {
			getInstance: (clazz: unknown) => any;
		}
	).getInstance(net.runelite.client.ui.overlay.OverlayManager),
	sub: [] as net.runelite.client.ui.overlay.Overlay[],
	subscribe(overlayItem: net.runelite.client.ui.overlay.Overlay): void {
		this.manager.add(overlayItem);
		this.sub.push(overlayItem);
	},
	unsubscribe(overlayItem: net.runelite.client.ui.overlay.Overlay): void {
		this.manager.remove(overlayItem);
		const index = this.sub.indexOf(overlayItem);
		if (index > -1) this.sub.splice(index, 1);
	},
	stop(): void {
		if (this.sub.length > 0) {
			this.sub.forEach((overlayItem) => {
				this.manager.remove(overlayItem);
			});
		}
		this.sub = [];
	},
};

const resolveCurrentEssenceInBank = (): {
	label: string;
	quantity: number;
} => {
	const daeyaltCount = bot.bank.getQuantityOfId(DAEYALT_ESSENCE_ID);
	if (daeyaltCount > 0) {
		return {
			label: 'Daeyalt Essence',
			quantity: daeyaltCount,
		};
	}

	return {
		label: 'Pure Essence',
		quantity: bot.bank.getQuantityOfId(PURE_ESSENCE_ID),
	};
};

const getTotalTrackedRunesInBank = (): number => {
	return TRACKED_RUNE_ITEM_IDS.reduce((total, runeId) => {
		return total + bot.bank.getQuantityOfId(runeId);
	}, 0);
};

const getTotalEssenceInBank = (): number => {
	return (
		bot.bank.getQuantityOfId(PURE_ESSENCE_ID) +
		bot.bank.getQuantityOfId(DAEYALT_ESSENCE_ID)
	);
};

const getCraftedRunesCount = (): number => {
	const currentTotal = getTotalTrackedRunesInBank();
	if (craftedRunesBaselineTotal < 0) {
		craftedRunesBaselineTotal = currentTotal;
		return 0;
	}

	return Math.max(0, currentTotal - craftedRunesBaselineTotal);
};

const getStateActionSnippet = (): string => {
	switch (state.mainState) {
		case MainStates.TRAVEL_TO_OURANIA_ALTAR: {
			return 'walking to altar';
		}
		case MainStates.INTERACT_WITH_OURANIA_ALTAR: {
			return 'crafting runes';
		}
		case MainStates.TRAVEL_TO_PRAYER_ALTAR: {
			return 'walking to prayer altar';
		}
		case MainStates.TRAVEL_TO_POH: {
			return 'restoring run energy';
		}
		case MainStates.TRAVEL_TO_DESERT: {
			return 'restoring at nardah';
		}
		case MainStates.SWAP_MAGE_BOOK: {
			return 'casting spellbook swap';
		}
		case MainStates.USE_PRAYER_ALTAR: {
			return 'using prayer altar';
		}
		case MainStates.TRAVEL_TO_BANK: {
			if (state.workflowStep === 2) {
				return 'ladder clicked';
			}
			if (state.workflowStep === 1) {
				return 'finding ladder';
			}
			return 'walking to bank';
		}
		case MainStates.INTERACT_WITH_BANK: {
			return 'banking supplies';
		}
		case MainStates.REPAIR_POUCHES: {
			return 'casting NPC Contact';
		}
		case MainStates.IDLE: {
			return 'idle';
		}
		default: {
			return 'running';
		}
	}
};

const getStateDisplayText = (): string => {
	switch (state.mainState) {
		case MainStates.TRAVEL_TO_OURANIA_ALTAR: {
			return 'OURANIA ALTAR';
		}
		case MainStates.INTERACT_WITH_OURANIA_ALTAR: {
			return 'CRAFT ALTER';
		}
		case MainStates.TRAVEL_TO_PRAYER_ALTAR: {
			return 'PRAYER ALTER';
		}
		case MainStates.TRAVEL_TO_POH: {
			return 'POH TRAVEL';
		}
		case MainStates.TRAVEL_TO_DESERT: {
			return 'DESERT TRAVEL';
		}
		case MainStates.SWAP_MAGE_BOOK: {
			return 'SWAP MAGE BOOK';
		}
		case MainStates.USE_PRAYER_ALTAR: {
			return 'USE PRAYER ALTAR';
		}
		case MainStates.TRAVEL_TO_BANK: {
			return 'TRAVEL TO BANK';
		}
		case MainStates.INTERACT_WITH_BANK: {
			return 'INTERACT WITH BANK';
		}
		case MainStates.REPAIR_POUCHES: {
			return 'REPAIR POUCHES';
		}
		case MainStates.IDLE: {
			return 'IDLE';
		}
		default: {
			return 'RUNNING';
		}
	}
};

const formatOverlayRows = (): Array<{ left: string; right: string }> => {
	const bankEssence = resolveCurrentEssenceInBank();

	return [
		{
			left: `Banked ${bankEssence.label}`,
			right: `${bankEssence.quantity}`,
		},
		{
			left: 'Runes Banked',
			right: `${getCraftedRunesCount()}`,
		},
		{
			left: 'State',
			right: getStateDisplayText(),
		},
		{
			left: 'Action',
			right: getStateActionSnippet(),
		},
	];
};

const overlayPanel = {
	panel: null as net.runelite.client.ui.overlay.OverlayPanel | null,
	override: {
		panelComponent:
			null as net.runelite.client.ui.overlay.components.PanelComponent | null,
		render(graphics: java.awt.Graphics2D): java.awt.Dimension | null {
			if (this.panelComponent) {
				const panelChildren = this.panelComponent.getChildren();
				panelChildren.clear();
				panelChildren.add(
					net.runelite.client.ui.overlay.components.TitleComponent.builder()
						.text('profOuraniaAlter')
						.color(java.awt.Color.CYAN)
						.build(),
				);
				panelChildren.add(
					net.runelite.client.ui.overlay.components.LineComponent.builder()
						.left('---------------------------')
						.right('')
						.leftColor(java.awt.Color.GRAY)
						.build(),
				);
				const builder =
					net.runelite.client.ui.overlay.components.LineComponent.builder();
				formatOverlayRows().forEach((row) => {
					panelChildren.add(
						builder
							.left(row.left)
							.right(row.right)
							.leftColor(java.awt.Color.decode('#ffb347'))
							.rightColor(java.awt.Color.WHITE)
							.build(),
					);
				});
			}

			return (
				this as unknown as {
					super$render: (
						g: java.awt.Graphics2D,
					) => java.awt.Dimension | null;
				}
			).super$render(graphics);
		},
	},
	create(): net.runelite.client.ui.overlay.OverlayPanel {
		const createdPanel = new (JavaAdapter as unknown as new (
			cls: typeof net.runelite.client.ui.overlay.OverlayPanel,
			override: unknown,
		) => net.runelite.client.ui.overlay.OverlayPanel)(
			net.runelite.client.ui.overlay.OverlayPanel,
			this.override,
		);
		createdPanel.setPosition(
			net.runelite.client.ui.overlay.OverlayPosition.BOTTOM_LEFT,
		);
		createdPanel.setPriority(
			net.runelite.client.ui.overlay.OverlayPriority.HIGH,
		);
		createdPanel.setPreferredSize(new java.awt.Dimension(OVERLAY_WIDTH, 0));
		const panelComponent = createdPanel.getPanelComponent() as {
			setWrap?: (wrap: boolean) => void;
			setPreferredSize?: (size: java.awt.Dimension) => void;
		};
		panelComponent.setWrap?.(false);
		panelComponent.setPreferredSize?.(
			new java.awt.Dimension(OVERLAY_WIDTH - 14, 0),
		);
		createdPanel.addMenuEntry(
			net.runelite.api.MenuAction.RUNELITE_OVERLAY,
			'Disable',
			'profOuraniaAlter panel',
			() => this.remove(),
		);
		return createdPanel;
	},
	start(): void {
		if (this.panel) return;
		this.panel = this.create();
		overlay.subscribe(this.panel);
	},
	remove(): void {
		if (!this.panel) return;
		overlay.unsubscribe(this.panel);
		this.panel = null;
	},
};

const disableBotMakerOverlay = (): void => {
	try {
		const manager = overlay.manager;
		manager.removeIf((overlayItem: unknown): boolean => {
			try {
				if (!overlayItem) return false;
				const item = overlayItem as {
					getClass?: () => { getName?: () => string };
					getLayer?: () => unknown;
					getPosition?: () => unknown;
				};
				const overlayClass = item.getClass?.();
				const overlayName = overlayClass?.getName?.();
				if (!overlayName || !overlayName.includes('plugins.botmaker')) {
					return false;
				}
				const layer = item.getLayer?.();
				const position = item.getPosition?.();
				if (
					layer ===
						net.runelite.client.ui.overlay.OverlayLayer
							.UNDER_WIDGETS &&
					position ===
						net.runelite.client.ui.overlay.OverlayPosition
							.BOTTOM_LEFT
				) {
					botMakerMainOverlayReference = overlayItem;
					return true;
				}
				return false;
			} catch {
				return false;
			}
		});
	} catch {
		return;
	}
};

const enableBotMakerOverlay = (): void => {
	try {
		if (!botMakerMainOverlayReference) return;
		overlay.manager.add(
			botMakerMainOverlayReference as net.runelite.client.ui.overlay.Overlay,
		);
		botMakerMainOverlayReference = null;
	} catch {
		return;
	}
};

export const onOverlayStart = (): void => {
	disableBotMakerOverlay();
	craftedRunesBaselineTotal = getTotalTrackedRunesInBank();
	essenceBaselineTotal = getTotalEssenceInBank();
	overlayPanel.start();
};

export const onOverlayTick = (): void => {
	return;
};

export const onOverlayEnd = (): void => {
	const runesBankedTotal = getCraftedRunesCount();
	const essenceUsedTotal =
		essenceBaselineTotal < 0
			? 0
			: Math.max(0, essenceBaselineTotal - getTotalEssenceInBank());
	log.printGameMessage(
		`Runtime Summary: Essence used ${essenceUsedTotal} | Runes banked ${runesBankedTotal}`,
	);
	overlayPanel.remove();
	overlay.stop();
	enableBotMakerOverlay();
	craftedRunesBaselineTotal = -1;
	essenceBaselineTotal = -1;
};
