import { useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Edit2,
  Plus,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  CreditCard,
  Bell,
  Shield,
  X,
  Wallet,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserOrders } from '@/hooks/useOrders';
import { formatPrice } from '@/data/products';

const Profile = () => {
  const { user, isAuthenticated, logout, updateProfile, supabaseUser, session } = useAuth();
  const { totalItems: wishlistCount } = useWishlist();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedPhone, setEditedPhone] = useState(user?.phone || '');
  
  // Settings dialog states
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const effectiveUserId = supabaseUser?.id || user?.id;
  const { data: orders = [], isLoading: isOrdersLoading } = useUserOrders(effectiveUserId, session?.access_token);
  const previewOrders = useMemo(() => orders.slice(0, 3), [orders]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSaveProfile = () => {
    updateProfile({ name: editedName, phone: editedPhone });
    setIsEditing(false);
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been updated successfully.',
    });
  };

  const handleSaveNotifications = () => {
    setNotificationDialogOpen(false);
    toast({
      title: 'Notifications Updated',
      description: 'Your notification preferences have been saved.',
    });
  };

  const handleSavePayment = () => {
    setPaymentDialogOpen(false);
    toast({
      title: 'Payment Methods',
      description: 'Payment method functionality coming soon.',
    });
  };

  const handleSavePrivacy = () => {
    setPrivacyDialogOpen(false);
    toast({
      title: 'Privacy Settings',
      description: 'Your privacy settings have been updated.',
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Force navigation with full page reload to ensure clean state
      // Using window.location.href instead of navigate() to prevent back-button issues
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, force redirect to ensure user is logged out from UI
      window.location.href = '/';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Shipped':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'Processing':
      case 'Order Placed':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Processing':
      case 'Order Placed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="container-custom py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-secondary rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-light tracking-wide mb-1">
                {user.name}
              </h1>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <p className="text-muted-foreground text-xs mt-1">
                Member since {formatDate(user.memberSince)}
              </p>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-medium">{orders.length}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Orders
                  </p>
                </div>
              </CardContent>
            </Card>
            <Link to="/wishlist">
              <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Heart className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-medium">{wishlistCount}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Wishlist
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-medium">{user.addresses?.length || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Addresses
                  </p>
                </div>
              </CardContent>
            </Card>
            <Link to="/wallet">
              <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-medium">{formatPrice(user.walletBalance || 0)}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Wallet Balance
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full md:w-auto flex flex-wrap justify-start gap-2 mb-6 bg-transparent p-0">
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background px-6 py-2 border border-border"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background px-6 py-2 border border-border"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="wallet"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background px-6 py-2 border border-border"
              >
                My Wallet
              </TabsTrigger>
              <TabsTrigger
                value="addresses"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background px-6 py-2 border border-border"
              >
                Addresses
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-foreground data-[state=active]:text-background px-6 py-2 border border-border"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium uppercase tracking-widest">
                  Your Orders
                </h2>
                <Link to="/orders">
                  <Button variant="outline" size="sm">
                    View All Orders
                  </Button>
                </Link>
              </div>
              {isOrdersLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                    <p className="text-muted-foreground">Loading your orders...</p>
                  </CardContent>
                </Card>
              ) : orders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No orders yet</p>
                    <Link to="/shop">
                      <Button>Start Shopping</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {previewOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <CardHeader className="bg-secondary/50 py-3 px-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Order ID
                              </p>
                              <p className="font-medium text-sm">{order.order_id || order.id}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8 hidden md:block" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Order Date
                              </p>
                              <p className="font-medium text-sm">
                                {formatDate(order.order_date || order.created_at || new Date().toISOString())}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <Badge
                              variant="secondary"
                              className={getStatusColor(order.status)}
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4"
                            >
                              <div className="w-16 h-16 bg-secondary flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="font-medium">{formatPrice(item.total_price)}</p>
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <p className="text-lg font-medium">
                              Total: {formatPrice(order.grand_total)}
                            </p>
                          </div>
                          <Link to="/orders">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {orders.length > 3 && (
                    <div className="text-center">
                      <Link to="/orders">
                        <Button variant="outline">
                          View All {orders.length} Orders
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium uppercase tracking-widest">
                  Personal Information
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      handleSaveProfile();
                    } else {
                      setEditedName(user.name);
                      setEditedPhone(user.phone || '');
                      setIsEditing(true);
                    }
                  }}
                >
                  {isEditing ? 'Save' : <Edit2 className="h-4 w-4" />}
                </Button>
              </div>

              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Full Name
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="bg-transparent"
                        />
                      ) : (
                        <p className="font-medium">{user.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Email Address
                      </Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Phone Number
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editedPhone}
                          onChange={(e) => setEditedPhone(e.target.value)}
                          className="bg-transparent"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {user.phone || 'Not added'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Member Since
                      </Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {user.memberSince ? formatDate(user.memberSince) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 pt-4">
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium uppercase tracking-widest">
                  My Wallet
                </h2>
                <Link to="/wallet">
                  <Button variant="outline" size="sm">
                    View Wallet History
                  </Button>
                </Link>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Wallet Balance
                      </p>
                      <p className="text-3xl font-semibold mt-1">{formatPrice(user.walletBalance || 0)}</p>
                    </div>
                    <div className="rounded-full bg-secondary p-4">
                      <Wallet className="h-7 w-7 text-foreground" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Refunds and cashbacks are stored here automatically. Use your wallet credit during checkout to pay first.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium uppercase tracking-widest">
                  Saved Addresses
                </h2>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>

              {!user.addresses || user.addresses.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      No addresses saved
                    </p>
                    <Button>Add Address</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.addresses.map((address) => (
                    <Card key={address.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="outline" className="uppercase text-xs">
                            {address.type}
                          </Badge>
                          {address.isDefault && (
                            <Badge className="bg-foreground text-background text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium mb-1">{address.street}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.country}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <h2 className="text-lg font-medium mb-4 uppercase tracking-widest">
                Account Settings
              </h2>

              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  <button 
                    onClick={() => setNotificationDialogOpen(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Notification Preferences</p>
                        <p className="text-xs text-muted-foreground">
                          Email, SMS, and push notifications
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>

                  <button 
                    onClick={() => setPaymentDialogOpen(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Payment Methods</p>
                        <p className="text-xs text-muted-foreground">
                          Manage saved cards and UPI
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>

                  <button 
                    onClick={() => setPrivacyDialogOpen(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Privacy Settings</p>
                        <p className="text-xs text-muted-foreground">
                          Manage your data and privacy
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-destructive"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Logout</p>
                        <p className="text-xs opacity-70">
                          Sign out from your account
                        </p>
                      </div>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Notification Preferences Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notification Preferences</DialogTitle>
            <DialogDescription>
              Choose how you want to receive notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive order updates via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive delivery alerts via SMS</p>
              </div>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Get real-time updates on your device</p>
              </div>
              <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNotifications}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Methods Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Methods</DialogTitle>
            <DialogDescription>
              Manage your saved payment methods
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No saved payment methods</p>
            <Button variant="outline" onClick={handleSavePayment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Settings Dialog */}
      <Dialog open={privacyDialogOpen} onOpenChange={setPrivacyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Privacy Settings</DialogTitle>
            <DialogDescription>
              Manage your data and privacy preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Profile Visibility</Label>
                <p className="text-xs text-muted-foreground">Allow others to see your profile</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Personalized Recommendations</Label>
                <p className="text-xs text-muted-foreground">Get product suggestions based on your activity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Marketing Emails</Label>
                <p className="text-xs text-muted-foreground">Receive promotional emails and offers</p>
              </div>
              <Switch />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setPrivacyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePrivacy}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
