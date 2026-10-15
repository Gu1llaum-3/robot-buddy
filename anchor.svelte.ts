// The place a page reserves for the robot: RobotAnchor registers it, RobotDock follows it.

export const anchor = $state<{ el: HTMLElement | null }>({ el: null });
