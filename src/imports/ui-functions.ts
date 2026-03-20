// imports
import { State } from './types.js';

// UI-related types and functions
export type ColorScheme = {
	BACKGROUND: java.awt.Color;
	TEXT: java.awt.Color;
	ACCENT: java.awt.Color;
	PANEL: java.awt.Color;
};

export function createUi(state?: State): void {
	void state;
}

//==================================================================================
//                     Ripped functions from discord for UI's
//==================================================================================

// Waypoint path visualisation with 'blinking' effect

// Config
const PULSE_MIN_ALPHA = 0.3; // Minimum opacity
const PULSE_MAX_ALPHA = 0.8; // Maximum opacity
const PULSE_SPEED = 0.05; // Pulse speed

// Colour for the route path
const ROUTE_PATH_COLOUR = { r: 0, g: 255, b: 255 };

// Pulse time tracker - increment this on each render frame
let pulseTime = 0;

/**
 * Draws the route path with a pulsing/blinking effect
 * @param waypoints - Array of WorldPoint waypoints to draw
 */
export const drawRoutePath = (
	graphics: java.awt.Graphics2D,
	waypoints: net.runelite.api.coords.WorldPoint[],
): void => {
	try {
		if (!waypoints || waypoints.length < 2) return;

		// Calculate alpha using sine wave for smooth pulsing fade
		pulseTime += PULSE_SPEED;
		const pulseAlpha =
			PULSE_MIN_ALPHA +
			(PULSE_MAX_ALPHA - PULSE_MIN_ALPHA) *
				(Math.sin(pulseTime) * 0.5 + 0.5); // Oscillates between 0 and 1

		// Find player's progress through the path
		const player = client.getLocalPlayer();
		if (!player) return;
		const playerPos = player.getWorldLocation();

		// Find furthest waypoint player has reached (within 4 tiles)
		let furthestReachedIndex = 0;
		for (const [index, waypoint] of waypoints.entries()) {
			if (playerPos.distanceTo(waypoint) <= 4) {
				furthestReachedIndex = index;
			}
		}

		// Start drawing from 2 waypoints behind furthest reached
		const startIndex = Math.max(0, furthestReachedIndex - 2);

		// Draw lines between waypoints with fade-in effect
		const fadeSegments = 4; // Number of segments to fade in
		graphics.setStroke(new java.awt.BasicStroke(2));

		for (let index = startIndex; index < waypoints.length - 1; index++) {
			const currentWp = waypoints[index];
			const nextWp = waypoints[index + 1];

			// Convert world coordinates to screen coordinates
			const currentLp = net.runelite.api.coords.LocalPoint.fromWorld(
				client,
				currentWp,
			);
			const nextLp = net.runelite.api.coords.LocalPoint.fromWorld(
				client,
				nextWp,
			);
			if (!currentLp || !nextLp) continue;

			const currentCanvas = net.runelite.api.Perspective.localToCanvas(
				client,
				currentLp,
				client.getPlane(),
			);
			const nextCanvas = net.runelite.api.Perspective.localToCanvas(
				client,
				nextLp,
				client.getPlane(),
			);
			if (!currentCanvas || !nextCanvas) continue;

			// First few segments fade in gradually
			const segmentIndex = index - startIndex;
			let fadeMultiplier = 1;
			if (segmentIndex < fadeSegments) {
				fadeMultiplier = 0.2 + 0.8 * (segmentIndex / fadeSegments);
			}

			// Combine pulsing alpha with fade-in multiplier
			const finalAlpha = pulseAlpha * fadeMultiplier;

			// Create colour with animated alpha
			const pathColour = new java.awt.Color(
				ROUTE_PATH_COLOUR.r / 255,
				ROUTE_PATH_COLOUR.g / 255,
				ROUTE_PATH_COLOUR.b / 255,
				finalAlpha,
			);

			graphics.setColor(pathColour);
			graphics.drawLine(
				currentCanvas.getX(),
				currentCanvas.getY(),
				nextCanvas.getX(),
				nextCanvas.getY(),
			);
		}
	} catch {
		// Silently handle errors
	}
};

//==================================================================================
