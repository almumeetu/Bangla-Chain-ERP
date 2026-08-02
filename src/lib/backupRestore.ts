/**
 * Bangla-Chain ERP — JSON Backup & Restore
 *
 * exportBackup()        → downloads a dated .json file with ALL ERP data
 * exportPartialBackup() → downloads a dated .json file with specific grouped table data
 * importBackup()        → reads a .json file and restores it into localStorage
 */

import { loadAllData, restoreAllData, type AllErpData } from './localStore';

export interface BackupFile {
  version:   number;
  exportedAt:string;
  type?:     string; // 'full' or specific group name
  data:      Partial<AllErpData>;
}

// ── Export Full ───────────────────────────────────────────────────────────────

export function exportBackup(shopName = 'DillerPro'): void {
  const backup: BackupFile = {
    version:    1,
    exportedAt: new Date().toISOString(),
    type:       'full',
    data:       loadAllData(),
  };

  const json     = JSON.stringify(backup, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const dateStr  = new Date().toISOString().split('T')[0];
  const safeName = shopName.replace(/\s+/g, '_');

  const a   = document.createElement('a');
  a.href    = url;
  a.download = `${safeName}_full_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Export Partial Group ──────────────────────────────────────────────────────

export function exportPartialBackup(keys: (keyof AllErpData)[], typeName: string, shopName = 'DillerPro'): void {
  const allData = loadAllData();
  const partialData: Partial<AllErpData> = {};
  
  keys.forEach(k => {
    partialData[k] = allData[k] as any;
  });

  const backup: BackupFile = {
    version:    1,
    exportedAt: new Date().toISOString(),
    type:       typeName,
    data:       partialData,
  };

  const json     = JSON.stringify(backup, null, 2);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const dateStr  = new Date().toISOString().split('T')[0];
  const safeName = shopName.replace(/\s+/g, '_');

  const a   = document.createElement('a');
  a.href    = url;
  a.download = `${safeName}_${typeName}_backup_${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import / Restore ──────────────────────────────────────────────────────────

export function importBackup(
  file:      File,
  onSuccess: (type: string) => void,
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
      
      const typeLabel = parsed.type || (Object.keys(parsed.data).length > 5 ? 'full' : Object.keys(parsed.data)[0]);
      onSuccess(typeLabel);
    } catch {
      onError('Could not parse backup file. Make sure it is a valid .json backup file.');
    }
  };

  reader.onerror = () => onError('Failed to read the file.');
  reader.readAsText(file);
}
