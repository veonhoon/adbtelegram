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
      const { stdout } = await execAsync('adb devices -l');
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
      await execAsync('adb version');
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
      await execAsync('adb kill-server');
      await execAsync('adb start-server');
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
          const { stdout } = await execAsync(`adb -s ${serial} shell getprop ${prop}`);
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
}
