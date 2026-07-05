/**
 * Bangla-Chain ERP — JSON Backup & Restore
 *
 * exportBackup()  → downloads a dated .json file with ALL ERP data
 * importBackup()  → reads a .json file and restores it into localStorage
 */

import { loadAllData, restoreAllData, type AllErpData } from './localStore';

export interface BackupFile {
  version:   number;
  exportedAt:string;
  data:      AllErpData;
}

// ── Export ────────────────────────────────────────────────────────────────────

export function exportBackup(shopName = 'DillerPro'): void {
  const backup: BackupFile = {
    version:    1,
    exportedAt: new Date().toISOString(),
    data:       loadAllData(),
  };

  const json     = JSON.stringify(backup, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const dateStr  = new Date().toISOString().split('T')[0];
  const safeName = shopName.replace(/\s+/g, '_');

  const a   = document.createElement('a');
  a.href    = url;
  a.download = `${safeName}_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import ────────────────────────────────────────────────────────────────────

export function importBackup(
  file:      File,
  onSuccess: () => void,
  onError:   (msg: string) => void,
): void {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const raw    = e.target?.result as string;
      const parsed = JSON.parse(raw) as BackupFile;

      if (!parsed.data) {
        onError('Invalid backup file — missing data field.');
        return;
      }

      restoreAllData(parsed.data);
      onSuccess();
    } catch {
      onError('Could not parse backup file. Make sure it is a valid DillerPro .json backup.');
    }
  };

  reader.onerror = () => onError('Failed to read the file.');
  reader.readAsText(file);
}
