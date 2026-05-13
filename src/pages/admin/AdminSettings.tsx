import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  Globe,
  CreditCard,
  Truck,
  Mail,
  Bell,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storeDescription: string;
  smtpHost: string;
  smtpPort: string;
  notifications: Record<string, boolean>;
  paymentMethods: Record<string, boolean>;
  razorpayKey: string;
  razorpaySecret: string;
  freeShippingThreshold: string;
  standardShippingFee: string;
  estimatedDelivery: string;
  returnsWindow: string;
  shippingPartners: Record<string, boolean>;
}

const defaultSettings: StoreSettings = {
  storeName: 'SWITCH',
  storeEmail: 'hello@switch.com',
  storeDescription: 'Premium fashion e-commerce store',
  smtpHost: 'smtp.sendgrid.net',
  smtpPort: '587',
  notifications: {
    'New Order Alerts': true,
    'Low Stock Warnings': true,
    'Return Requests': true,
    'Weekly Reports': false,
  },
  paymentMethods: {
    cod: true,
    upi: true,
    card: true,
    netbanking: false,
    wallet: true,
  },
  razorpayKey: 'rzp_live_xxxxx',
  razorpaySecret: '',
  freeShippingThreshold: '999',
  standardShippingFee: '49',
  estimatedDelivery: '3-5',
  returnsWindow: '30',
  shippingPartners: {
    Delhivery: true,
    'Blue Dart': true,
    FedEx: false,
    'India Post': true,
  },
};

const settingsTabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'shipping', label: 'Shipping', icon: Truck },
] as const;

type SettingsTabId = typeof settingsTabs[number]['id'];

function loadSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load settings:', err);
  }
  return { ...defaultSettings };
}

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [settings, setSettings] = useState<StoreSettings>(loadSettings);

  useEffect(() => {
    (async () => {
      try {
        const { data: remote } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'store_settings')
          .maybeSingle();
        if (remote?.value) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote.value));
        }
      } catch (err) {
        console.warn('Failed to fetch remote settings:', err);
      }
      const loaded = loadSettings();
      setSettings(loaded);
    })();
  }, []);

  const updateField = <K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNotification = (label: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [label]: checked },
    }));
  };

  const updatePaymentMethod = (key: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      paymentMethods: { ...prev.paymentMethods, [key]: checked },
    }));
  };

  const updateShippingPartner = (name: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      shippingPartners: { ...prev.shippingPartners, [name]: checked },
    }));
  };

  const handleSave = async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    try {
      await supabase.from('admin_settings').upsert({
        key: 'store_settings',
        value: JSON.parse(JSON.stringify(settings)),
      }, { onConflict: 'key' });
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    toast({
      title: 'Settings saved',
      description: 'Your changes have been saved successfully.',
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your store configuration</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Save size={16} />
            Save Changes
          </motion.button>
        </motion.div>

        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="max-w-2xl space-y-6"
        >
          {activeTab === 'general' && (
            <>
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  Store Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Store Name</label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => updateField('storeName', e.target.value)}
                      className="w-full h-10 px-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Store Email</label>
                    <input
                      type="email"
                      value={settings.storeEmail}
                      onChange={(e) => updateField('storeEmail', e.target.value)}
                      className="w-full h-10 px-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Store Description</label>
                    <textarea
                      rows={3}
                      value={settings.storeDescription}
                      onChange={(e) => updateField('storeDescription', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  Email Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.smtpHost}
                      onChange={(e) => updateField('smtpHost', e.target.value)}
                      className="w-full h-10 px-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">SMTP Port</label>
                    <input
                      type="text"
                      value={settings.smtpPort}
                      onChange={(e) => updateField('smtpPort', e.target.value)}
                      className="w-full h-10 px-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Bell size={16} className="text-primary" />
                  Notification Preferences
                </h3>
                {[
                  { label: 'New Order Alerts', desc: 'Get notified when a new order is placed' },
                  { label: 'Low Stock Warnings', desc: 'Receive alerts when products run low' },
                  { label: 'Return Requests', desc: 'Notifications for new return requests' },
                  { label: 'Weekly Reports', desc: 'Receive weekly performance reports' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!settings.notifications[item.label]}
                        onChange={(e) => updateNotification(item.label, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'payment' && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                Payment Methods
              </h3>
              {[
                { name: 'Cash on Delivery', key: 'cod' },
                { name: 'UPI', key: 'upi' },
                { name: 'Credit/Debit Card', key: 'card' },
                { name: 'Net Banking', key: 'netbanking' },
                { name: 'Wallet', key: 'wallet' },
              ].map((method) => (
                <div key={method.key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <CreditCard size={16} className="text-muted-foreground" />
                    <p className="text-sm font-medium">{method.name}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!settings.paymentMethods[method.key]}
                      onChange={(e) => updatePaymentMethod(method.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">Razorpay Configuration</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">API Key</label>
                    <input
                      type="text"
                      value={settings.razorpayKey}
                      onChange={(e) => updateField('razorpayKey', e.target.value)}
                      className="w-full h-10 px-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">API Secret</label>
                    <input
                      type="password"
                      value={settings.razorpaySecret}
                      onChange={(e) => updateField('razorpaySecret', e.target.value)}
                      className="w-full h-10 px-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-5">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Truck size={16} className="text-primary" />
                Shipping Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Free Shipping Threshold</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <input
                      type="text"
                      value={settings.freeShippingThreshold}
                      onChange={(e) => updateField('freeShippingThreshold', e.target.value)}
                      className="w-full h-10 pl-8 pr-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Standard Shipping Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <input
                      type="text"
                      value={settings.standardShippingFee}
                      onChange={(e) => updateField('standardShippingFee', e.target.value)}
                      className="w-full h-10 pl-8 pr-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estimated Delivery (Days)</label>
                  <input
                    type="text"
                    value={settings.estimatedDelivery}
                    onChange={(e) => updateField('estimatedDelivery', e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Returns Window (Days)</label>
                  <input
                    type="text"
                    value={settings.returnsWindow}
                    onChange={(e) => updateField('returnsWindow', e.target.value)}
                    className="w-full h-10 px-4 rounded-lg bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">Shipping Partners</h4>
                {[
                  { name: 'Delhivery' },
                  { name: 'Blue Dart' },
                  { name: 'FedEx' },
                  { name: 'India Post' },
                ].map((partner) => (
                  <div key={partner.name} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Truck size={14} className="text-muted-foreground" />
                      <p className="text-sm">{partner.name}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!settings.shippingPartners[partner.name]}
                        onChange={(e) => updateShippingPartner(partner.name, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-foreground after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
