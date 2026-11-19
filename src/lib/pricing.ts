// Single source of truth for cost/cap constants, imported by both the client
// (to render limits/enable-disable UI) and the server (to enforce them for real).
export const SINGLE_ANALYSIS_COST = 1;
export const FLOW_ANALYSIS_COST = 3;
export const FLOW_MIN_SCREENS = 2;
export const FLOW_MAX_SCREENS = 8;

// Video input adapter caps (client-side extraction, no server-side video handling).
export const FLOW_VIDEO_MAX_DURATION_S = 90;
export const FLOW_VIDEO_MAX_SIZE_BYTES = 60 * 1024 * 1024;
