import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ADBDevice {
  serial: string;
  status: 'device' | 'offline' | 'unauthorized' | 'unknown';
  product?: string;
  model?: string;
  device?: string;
}

export class ADBMonitor {
  /**
   * Get list of all ADB devices connected to this machine
   */
  async getConnectedDevices(): Promise<ADBDevice[]> {
    try {
      const { stdout } = await execAsync('adb devices -l', { windowsHide: true });
      return this.parseADBDevices(stdout);
    } catch (error) {
      console.error('Error executing adb devices:', error);
      return [];
    }
  }

  /**
   * Parse output from 'adb devices -l'
   */
  private parseADBDevices(output: string): ADBDevice[] {
    const lines = output.split('\n').slice(1); // Skip first line "List of devices attached"
    const devices: ADBDevice[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Format: serial   status   product:xxx model:xxx device:xxx
      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) continue;

      const serial = parts[0];
      const status = this.normalizeStatus(parts[1]);

      // Parse additional info
      const info: any = { serial, status };
      for (let i = 2; i < parts.length; i++) {
        const [key, value] = parts[i].split(':');
        if (key && value) {
          info[key] = value;
        }
      }

      devices.push(info as ADBDevice);
    }

    return devices;
  }

  /**
   * Normalize ADB status to our internal format
   */
  private normalizeStatus(status: string): 'device' | 'offline' | 'unauthorized' | 'unknown' {
    const normalized = status.toLowerCase();
    if (normalized === 'device') return 'device';
    if (normalized === 'offline') return 'offline';
    if (normalized === 'unauthorized') return 'unauthorized';
    return 'unknown';
  }

  /**
   * Get status of a specific device by serial
   */
  async getDeviceStatus(serial: string): Promise<'online' | 'offline' | 'unauthorized' | 'unknown'> {
    const devices = await this.getConnectedDevices();
    const device = devices.find(d => d.serial === serial);

    if (!device) return 'offline';
    if (device.status === 'device') return 'online';
    if (device.status === 'unauthorized') return 'unauthorized';
    if (device.status === 'offline') return 'offline';
    return 'unknown';
  }

  /**
   * Check if ADB is available on this system
   */
  async isADBAvailable(): Promise<boolean> {
    try {
      await execAsync('adb version', { windowsHide: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Restart ADB server (useful for troubleshooting)
   */
  async restartADBServer(): Promise<void> {
    try {
      await execAsync('adb kill-server', { windowsHide: true });
      await execAsync('adb start-server', { windowsHide: true });
    } catch (error) {
      console.error('Error restarting ADB server:', error);
      throw error;
    }
  }

  /**
   * Get device properties (requires device to be online)
   */
  async getDeviceInfo(serial: string): Promise<Record<string, string>> {
    try {
      const properties = ['ro.product.model', 'ro.product.manufacturer', 'ro.build.version.release'];
      const info: Record<string, string> = {};

      for (const prop of properties) {
        try {
          const { stdout } = await execAsync(`adb -s ${serial} shell getprop ${prop}`, { windowsHide: true });
          const key = prop.split('.').pop() || prop;
          info[key] = stdout.trim();
        } catch {
          // Skip if property not available
        }
      }

      return info;
    } catch (error) {
      console.error(`Error getting device info for ${serial}:`, error);
      return {};
    }
  }

  /**
   * Mute device completely - sets all volume streams to 0
   */
  async muteDevice(serial: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use input keyevent to set volumes to minimum
      // This simulates pressing volume down buttons multiple times

      // Press volume down 25 times to ensure all volumes are at 0
      // This affects media, ring, notification, and alarm volumes
      for (let i = 0; i < 25; i++) {
        await execAsync(`adb -s ${serial} shell input keyevent KEYCODE_VOLUME_DOWN`, { windowsHide: true });
      }

      // Set ringer mode to silent using settings command
      await execAsync(`adb -s ${serial} shell settings put global zen_mode 1`, { windowsHide: true });

      // Also disable all notification sounds via settings
      await execAsync(`adb -s ${serial} shell settings put system volume_ring 0`, { windowsHide: true });
      await execAsync(`adb -s ${serial} shell settings put system volume_notification 0`, { windowsHide: true });
      await execAsync(`adb -s ${serial} shell settings put system volume_music 0`, { windowsHide: true });
      await execAsync(`adb -s ${serial} shell settings put system volume_alarm 0`, { windowsHide: true });
      await execAsync(`adb -s ${serial} shell settings put system volume_system 0`, { windowsHide: true });

      return { success: true };
    } catch (error: any) {
      console.error(`Error muting device ${serial}:`, error);
      return { success: false, error: error.message };
    }
  }
}
