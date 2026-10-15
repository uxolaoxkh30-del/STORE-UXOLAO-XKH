import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ProductManagementView } from './components/ProductManagementView';
import { StockInView } from './components/StockInView';
import { StockOutView } from './components/StockOutView';
import { MovementsView } from './components/MovementsView';
import { ReportsView } from './components/ReportsView';
import { WarehouseZonesView } from './components/WarehouseZonesView';
import { StockAuditView } from './components/StockAuditView';
import { VoucherModal } from './components/VoucherModal';
import { BarcodeLabelsModal } from './components/BarcodeLabelsModal';
import { SettingsModal } from './components/SettingsModal';
import { StockMovement, Product } from './types/inventory';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Cross-view actions
  const [activeStockInProductId, setActiveStockInProductId] = useState<string | undefined>(undefined);
  const [activeStockOutProductId, setActiveStockOutProductId] = useState<string | undefined>(undefined);
  const [isAddProductInitiallyOpen, setIsAddProductInitiallyOpen] = useState<boolean>(false);

  // Modals
  const [activeVoucherMovement, setActiveVoucherMovement] = useState<StockMovement | null>(null);
  const [isBarcodeLabelsOpen, setIsBarcodeLabelsOpen] = useState<boolean>(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const { products, findProduct } = useInventory();

  const handleOpenStockIn = (productId?: string) => {
    setActiveStockInProductId(productId);
    setCurrentTab('stock-in');
    setMobileMenuOpen(false);
  };

  const handleOpenStockOut = (productId?: string) => {
    setActiveStockOutProductId(productId);
    setCurrentTab('stock-out');
    setMobileMenuOpen(false);
  };

  const handleOpenAddProduct = () => {
    setIsAddProductInitiallyOpen(true);
    setCurrentTab('products');
    setMobileMenuOpen(false);
  };

  const handleSelectVoucher = (movement: StockMovement) => {
    setActiveVoucherMovement(movement);
  };

  const handleOpenBarcodeLabels = (product?: Product) => {
    setSelectedBarcodeProduct(product);
    setIsBarcodeLabelsOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAddProduct={handleOpenAddProduct}
        onOpenStockIn={() => handleOpenStockIn()}
        onOpenStockOut={() => handleOpenStockOut()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBarcodeLabels={() => handleOpenBarcodeLabels(undefined)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={setCurrentTab}
              onOpenStockIn={handleOpenStockIn}
              onOpenStockOut={handleOpenStockOut}
              onOpenAddProduct={handleOpenAddProduct}
              onSelectVoucher={handleSelectVoucher}
            />
          )}

          {currentTab === 'products' && (
            <ProductManagementView
              onOpenStockIn={handleOpenStockIn}
              onOpenStockOut={handleOpenStockOut}
              onPrintBarcode={handleOpenBarcodeLabels}
              isAddModalOpenInitially={isAddProductInitiallyOpen}
            />
          )}

          {currentTab === 'stock-in' && (
            <StockInView
              initialProductId={activeStockInProductId}
              onSelectVoucher={handleSelectVoucher}
            />
          )}

          {currentTab === 'stock-out' && (
            <StockOutView
              initialProductId={activeStockOutProductId}
              onSelectVoucher={handleSelectVoucher}
            />
          )}

          {currentTab === 'movements' && (
            <MovementsView onSelectVoucher={handleSelectVoucher} />
          )}

          {currentTab === 'zones' && (
            <WarehouseZonesView
              onOpenStockIn={handleOpenStockIn}
              onOpenStockOut={handleOpenStockOut}
              onNavigateProducts={() => setCurrentTab('products')}
            />
          )}

          {currentTab === 'stock-take' && (
            <StockAuditView
              onNavigateMovements={() => setCurrentTab('movements')}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView onOpenStockIn={handleOpenStockIn} />
          )}
        </main>
      </div>

      {/* Official Voucher Print Modal */}
      {activeVoucherMovement && (
        <VoucherModal
          movement={activeVoucherMovement}
          product={findProduct(activeVoucherMovement.productId)}
          onClose={() => setActiveVoucherMovement(null)}
        />
      )}

      {/* Barcode & Shelf Label Print Modal */}
      <BarcodeLabelsModal
        isOpen={isBarcodeLabelsOpen}
        onClose={() => {
          setIsBarcodeLabelsOpen(false);
          setSelectedBarcodeProduct(undefined);
        }}
        products={products}
        selectedProduct={selectedBarcodeProduct}
      />

      {/* System Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}
