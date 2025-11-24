import Database from 'better-sqlite3';
import path from 'path';

export interface Server {
  id: string;
  name: string;
  last_seen: number;
  status: 'online' | 'offline';
}

export interface Device {
  serial: string;
  server_id: string;
  name?: string;
  status: 'online' | 'offline' | 'unauthorized' | 'unknown';
  last_status: string;
  last_check: number;
  added_at: number;
}

export interface StatusChange {
  id?: number;
  device_serial: string;
  server_id: string;
  old_status: string;
  new_status: string;
  timestamp: number;
  notified: number;
}

export class ADBDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './adb_tracker.db') {
    this.db = new Database(dbPath);
    this.initTables();
  }

  private initTables() {
    // Servers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        last_seen INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'offline'
      )
    `);

    // Devices table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        serial TEXT NOT NULL,
        server_id TEXT NOT NULL,
        name TEXT,
        status TEXT NOT NULL DEFAULT 'unknown',
        last_status TEXT,
        last_check INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (serial, server_id),
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
      )
    `);

    // Status changes history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS status_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_serial TEXT NOT NULL,
        server_id TEXT NOT NULL,
        old_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        notified INTEGER DEFAULT 0
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_devices_server ON devices(server_id);
      CREATE INDEX IF NOT EXISTS idx_status_changes_notified ON status_changes(notified);
      CREATE INDEX IF NOT EXISTS idx_status_changes_timestamp ON status_changes(timestamp);
    `);
  }

  // Server operations
  upsertServer(id: string, name: string, status: 'online' | 'offline' = 'online'): void {
    const stmt = this.db.prepare(`
      INSERT INTO servers (id, name, last_seen, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        last_seen = excluded.last_seen,
        status = excluded.status
    `);
    stmt.run(id, name, Date.now(), status);
  }

  getServer(id: string): Server | undefined {
    const stmt = this.db.prepare('SELECT * FROM servers WHERE id = ?');
    return stmt.get(id) as Server | undefined;
  }

  getAllServers(): Server[] {
    const stmt = this.db.prepare('SELECT * FROM servers ORDER BY name');
    return stmt.all() as Server[];
  }

  updateServerStatus(id: string, status: 'online' | 'offline'): void {
    const stmt = this.db.prepare('UPDATE servers SET status = ?, last_seen = ? WHERE id = ?');
    stmt.run(status, Date.now(), id);
  }

  // Device operations
  addDevice(serial: string, serverId: string, name?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO devices (serial, server_id, name, status, last_check, added_at)
      VALUES (?, ?, ?, 'unknown', ?, ?)
      ON CONFLICT(serial, server_id) DO NOTHING
    `);
    const now = Date.now();
    stmt.run(serial, serverId, name, now, now);
  }

  setDeviceName(serial: string, serverId: string, name: string): void {
    const stmt = this.db.prepare('UPDATE devices SET name = ? WHERE serial = ? AND server_id = ?');
    stmt.run(name, serial, serverId);
  }

  getDeviceName(serial: string, serverId: string): string | undefined {
    const device = this.getDevice(serial, serverId);
    return device?.name;
  }

  removeDevice(serial: string, serverId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM devices WHERE serial = ? AND server_id = ?');
    const result = stmt.run(serial, serverId);
    return result.changes > 0;
  }

  getDevice(serial: string, serverId: string): Device | undefined {
    const stmt = this.db.prepare('SELECT * FROM devices WHERE serial = ? AND server_id = ?');
    return stmt.get(serial, serverId) as Device | undefined;
  }

  getDevicesByServer(serverId: string): Device[] {
    const stmt = this.db.prepare('SELECT * FROM devices WHERE server_id = ? ORDER BY serial');
    return stmt.all(serverId) as Device[];
  }

  getAllDevices(): Device[] {
    const stmt = this.db.prepare('SELECT * FROM devices ORDER BY server_id, serial');
    return stmt.all() as Device[];
  }

  updateDeviceStatus(serial: string, serverId: string, status: string): boolean {
    const device = this.getDevice(serial, serverId);
    if (!device) return false;

    const oldStatus = device.status;
    const now = Date.now();

    // Update device status
    const stmt = this.db.prepare(`
      UPDATE devices
      SET status = ?, last_status = ?, last_check = ?
      WHERE serial = ? AND server_id = ?
    `);
    stmt.run(status, oldStatus, now, serial, serverId);

    // Log status change if different
    if (oldStatus !== status) {
      this.logStatusChange(serial, serverId, oldStatus, status);
      return true; // Status changed
    }
    return false; // Status unchanged
  }

  // Status change operations
  private logStatusChange(serial: string, serverId: string, oldStatus: string, newStatus: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO status_changes (device_serial, server_id, old_status, new_status, timestamp, notified)
      VALUES (?, ?, ?, ?, ?, 0)
    `);
    stmt.run(serial, serverId, oldStatus, newStatus, Date.now());
  }

  getUnnotifiedChanges(): StatusChange[] {
    const stmt = this.db.prepare(`
      SELECT * FROM status_changes
      WHERE notified = 0
      ORDER BY timestamp ASC
    `);
    return stmt.all() as StatusChange[];
  }

  markChangeAsNotified(id: number): void {
    const stmt = this.db.prepare('UPDATE status_changes SET notified = 1 WHERE id = ?');
    stmt.run(id);
  }

  getRecentChanges(limit: number = 50): StatusChange[] {
    const stmt = this.db.prepare(`
      SELECT * FROM status_changes
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(limit) as StatusChange[];
  }

  // Utility
  close(): void {
    this.db.close();
  }

  getStats(): { servers: number; devices: number; online: number; offline: number; unauthorized: number } {
    const servers = this.db.prepare('SELECT COUNT(*) as count FROM servers').get() as { count: number };
    const devices = this.db.prepare('SELECT COUNT(*) as count FROM devices').get() as { count: number };
    const online = this.db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'online'").get() as { count: number };
    const offline = this.db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'offline'").get() as { count: number };
    const unauthorized = this.db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'unauthorized'").get() as { count: number };

    return {
      servers: servers.count,
      devices: devices.count,
      online: online.count,
      offline: offline.count,
      unauthorized: unauthorized.count
    };
  }
}
