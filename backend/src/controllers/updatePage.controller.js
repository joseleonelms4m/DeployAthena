import { Tools } from "../tools/tools.js";

const { statusBadge } = Tools

const UB_COLORS = { PENDING: "#64748b", UPDATE_PROGRESS: "#f59e0b", UPDATE_OK: "#22c55e", UPDATE_FAILED: "#ef4444" };
const PC_COLORS = { PENDING: "#64748b", IN_PROGRESS: "#f59e0b", PERCLOS_ON: "#22c55e", PERCLOS_OFF: "#f97316" };
const VIB_COLORS = { PENDING: "#64748b", IN_PROGRESS: "#f59e0b", VIB_ON: "#22c55e", VIB_OFF: "#f97316" };

function badgeSpan(value, colors) {
  if (!value) return `<span style="color:#475569;font-size:12px">-</span>`;
  const color = colors[value] || "#334155";
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px">${value}</span>`;
}

function buildRowData(hub, state) {
  const s = state[hub.ip] || {};
  return {
    ip: hub.ip,
    name: hub.name,
    statusBadge: statusBadge(s.status),
    lastAttempt: s.lastAttempt || "-",
    updateBadge: badgeSpan(s.updateStatus || "PENDING", UB_COLORS),
    perclosBadge: badgeSpan(s.perclosStatus || "PENDING", PC_COLORS),
    vibrationBadge: badgeSpan(s.vibrationStatus || "PENDING", VIB_COLORS),
  };
}

export function buildStateUpdate(hubs, state, shake) {
  return {
    type: "state",
    hubs: hubs.map(hub => buildRowData(hub, state)),
    ...(shake ? { shake } : {}),
  };
}
