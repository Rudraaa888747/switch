import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Calendar, CreditCard, Filter, Wallet as WalletIcon } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';

interface WalletTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  source: string;
  description: string;
  balance_after: number;
  created_at: string;
  reference_id?: string;
}

const Wallet = () => {
  const { user, isAuthenticated, supabaseUser } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const userId = supabaseUser?.id || user?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`wallet-live-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['wallet-profile-balance', userId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['wallet-profile-balance', userId] });
          queryClient.invalidateQueries({ queryKey: ['wallet-transactions', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  const { data: profileBalance } = useQuery({
    queryKey: ['wallet-profile-balance', userId],
    queryFn: async () => {
      if (!userId) return user?.walletBalance ?? 0;

      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return Number(data?.wallet_balance ?? user?.walletBalance ?? 0);
    },
    enabled: !!userId,
    refetchInterval: 15_000,
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['wallet-transactions', userId, filterType],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WalletTransaction[];
    },
    enabled: !!userId,
  });

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      refund: 'Refund',
      cashback: 'Cashback',
      payment: 'Payment',
      admin_credit: 'Admin Credit',
    };
    return labels[source] || source;
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      refund: 'bg-green-500/10 text-green-700 dark:text-green-400',
      cashback: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      payment: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
      admin_credit: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    };
    return colors[source] || 'bg-muted text-muted-foreground';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="container-custom py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-light tracking-wide mb-2">My Wallet</h1>
            <p className="text-muted-foreground text-sm">
              Manage your wallet balance and view transaction history
            </p>
          </div>

          {/* Balance Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                    Available Balance
                  </p>
                  <p className="text-4xl md:text-5xl font-bold">
                    {formatPrice(profileBalance ?? user.walletBalance ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use wallet balance during checkout
                  </p>
                </div>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <WalletIcon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg font-medium uppercase tracking-wide">
                  Transaction History
                </CardTitle>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="credit">Credits Only</SelectItem>
                    <SelectItem value="debit">Debits Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center">
                  <WalletIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">No transactions yet</p>
                  <p className="text-xs text-muted-foreground">
                    Your wallet transactions will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 md:p-6 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            transaction.type === 'credit'
                              ? 'bg-green-500/10'
                              : 'bg-red-500/10'
                          }`}
                        >
                          {transaction.type === 'credit' ? (
                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <div className="flex-1">
                              <p className="font-medium text-sm mb-1">
                                {transaction.description || getSourceLabel(transaction.source)}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={getSourceColor(transaction.source)}
                                >
                                  {getSourceLabel(transaction.source)}
                                </Badge>
                                {transaction.reference_id && (
                                  <span className="text-xs text-muted-foreground">
                                    Ref: {transaction.reference_id.slice(0, 8)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-bold text-lg ${
                                  transaction.type === 'credit'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {transaction.type === 'credit' ? '+' : '-'}
                                {formatPrice(transaction.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Balance: {formatPrice(transaction.balance_after)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="w-3 h-3" />
                            {formatDate(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <WalletIcon className="w-4 h-4" />
                How Wallet Works
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Refunds from returns are automatically credited to your wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Use wallet balance during checkout to pay instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Cashback and promotional credits are added here</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>No expiry on wallet balance - use anytime</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Wallet;
