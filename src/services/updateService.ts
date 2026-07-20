import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";

/**
 * Checks GitHub Releases for a newer version and, if found, prompts the user
 * to install it. Silent when there's no update or the check fails (e.g. offline).
 */
export async function checkForUpdates(): Promise<void> {
    try {
        const update = await check();
        if (!update) return;

        toast.info(`Update ${update.version} available`, {
            description: "Click to download and install.",
            duration: 15000,
            action: {
                label: "Install",
                onClick: () => void installUpdate(update),
            },
        });
    } catch (error) {
        console.error("Update check failed:", error);
    }
}

async function installUpdate(update: Awaited<ReturnType<typeof check>>): Promise<void> {
    if (!update) return;
    try {
        toast.info("Downloading update...");
        await update.downloadAndInstall();
        toast.success("Update installed, restarting...");
        await relaunch();
    } catch (error) {
        console.error("Update install failed:", error);
        toast.error("Failed to install update", {
            description: String(error),
        });
    }
}
