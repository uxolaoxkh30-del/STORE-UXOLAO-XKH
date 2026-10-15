import React, { useState, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { WarehouseSettings } from '../types/inventory';
import { 
  Settings, 
  X, 
  Building2, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Check, 
  DollarSign, 
  Coins, 
  ShieldAlert,
  FileJson
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, exportBackup, importBackup, resetToDemoData, clearAllData } = useInventory();

  const [formSettings, setFormSettings] = useState<WarehouseSettings>(settings);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setSuccessMsg('ບັນທຶກການຕັ້ງຄ່າສຳເລັດແລ້ວ!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        const res = importBackup(content);
        if (res.success) {
          setSuccessMsg('ກູ້ຄືນຂໍ້ມູນສຳຮອງສຳເລັດແລ້ວ!');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1500);
        } else {
          setErrorMsg(res.error || 'ໄຟລ໌ບໍ່ຖືກຕ້ອງ');
          setTimeout(() => setErrorMsg(null), 4000);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">ຕັ້ງຄ່າລະບົບສາງ ແລະ ສຳຮອງຂໍ້ມູນ (Settings & Backup)</h3>
              <p className="text-xs text-slate-400">ຂໍ້ມູນສາງ, ອັດຕາແລກປ່ຽນ ແລະ ການສຳຮອງຖານຂໍ້ມູນ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="m-4 mb-0 p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-5 text-sm max-h-[75vh] overflow-y-auto">
          {/* Section 1: Warehouse & Company Details */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 text-indigo-700">
              <Building2 className="w-4 h-4" />
              ຂໍ້ມູນສາງ ແລະ ຫົວໜ່ວຍທຸລະກິດ
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ສາງສິນຄ້າ (Warehouse Name)
                </label>
                <input
                  type="text"
                  required
                  value={formSettings.warehouseName}
                  onChange={e => setFormSettings({ ...formSettings, warehouseName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ບໍລິສັດ / ອົງກອນ (Company Name)
                </label>
                <input
                  type="text"
                  required
                  value={formSettings.companyName}
                  onChange={e => setFormSettings({ ...formSettings, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ທີ່ຕັ້ງສາງສິນຄ້າ (Address)
                </label>
                <input
                  type="text"
                  value={formSettings.address}
                  onChange={e => setFormSettings({ ...formSettings, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ເບີໂທລະສັບຕິດຕໍ່ (Phone)
                  </label>
                  <input
                    type="text"
                    value={formSettings.phone}
                    onChange={e => setFormSettings({ ...formSettings, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ອີເມລ (Email)
                  </label>
                  <input
                    type="email"
                    value={formSettings.email}
                    onChange={e => setFormSettings({ ...formSettings, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Currency & Exchange Rates */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 text-indigo-700">
              <Coins className="w-4 h-4" />
              ສະກຸນເງິນ & ອັດຕາແລກປ່ຽນອ້າງອີງ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1 ບາດໄທ (THB) = ເທົ່າໃດກີບ?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formSettings.thbRate}
                    onChange={e => setFormSettings({ ...formSettings, thbRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500">₭</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1 ໂດລາສະຫະລັດ (USD) = ເທົ່າໃດກີບ?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formSettings.usdRate}
                    onChange={e => setFormSettings({ ...formSettings, usdRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                  <span className="text-xs text-slate-500">₭</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Database Backup & Restore */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 text-indigo-700">
              <FileJson className="w-4 h-4" />
              ການສຳຮອງ ແລະ ກູ້ຄືນຖານຂໍ້ມູນ (Backup & Restore)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export JSON */}
              <button
                type="button"
                onClick={exportBackup}
                className="p-3 rounded-xl border border-slate-300 hover:bg-slate-50 transition cursor-pointer flex items-center gap-3 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">ດາວໂຫຼດ Backup (.JSON)</div>
                  <div className="text-[11px] text-slate-500">ບັນທຶກຂໍ້ມູນທັງໝົດໄວ້ໃນເຄື່ອງ</div>
                </div>
              </button>

              {/* Import JSON */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl border border-slate-300 hover:bg-slate-50 transition cursor-pointer flex items-center gap-3 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-xs">ກູ້ຄືນຂໍ້ມູນສຳຮອງ (Restore)</div>
                  <div className="text-[11px] text-slate-500">ອັບໂຫຼດໄຟລ໌ JSON ເພື່ອນຳເຂົ້າ</div>
                </div>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />

            {/* Reset / Clear Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (confirm('ທ່ານຕ້ອງການຣີເຊັດຂໍ້ມູນຕົວຢ່າງເລີ່ມຕົ້ນຄືນໃໝ່ແທ້ບໍ່?')) {
                    resetToDemoData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ຣີເຊັດຂໍ້ມູນຕົວຢ່າງ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('ຄຳເຕືອນ: ທ່ານຕ້ອງການລຶບຂໍ້ມູນສິນຄ້າ ແລະ ລາຍການທັງໝົດແທ້ບໍ່? ການກະທຳນີ້ບໍ່ສາມາດຍົກເລີກໄດ້!')) {
                    clearAllData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1.5 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ລຶບຂໍ້ມູນທັງໝົດ</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-xs cursor-pointer"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition cursor-pointer shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>ບັນທຶກການຕັ້ງຄ່າ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
