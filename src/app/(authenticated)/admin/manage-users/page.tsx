
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Hourglass, ShieldCheck, UserCog, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getAllUsers, updateUserStatus } from '@/lib/firebase/firestore-service';
import type { UserProfile, UserStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const statusFilters: (UserStatus | 'all')[] = ['all', 'pending', 'active', 'rejected'];

const statusConfig: Record<UserStatus, { icon: React.ElementType, color: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { icon: Hourglass, color: 'text-yellow-600', variant: 'outline' },
  active: { icon: CheckCircle, color: 'text-green-600', variant: 'secondary' },
  rejected: { icon: XCircle, color: 'text-red-600', variant: 'destructive' },
};

export default function ManageUsersPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<UserStatus | 'all'>('all');
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
      router.push('/dashboard');
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user data.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser, router, toast]);

  const handleUpdateStatus = async (uid: string, newStatus: UserStatus) => {
    setIsUpdating(prev => ({ ...prev, [uid]: true }));
    try {
      await updateUserStatus(uid, newStatus);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.uid === uid ? { ...user, status: newStatus } : user
        )
      );
      toast({ title: 'Success', description: `User status updated to ${newStatus}.` });
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user status.' });
    } finally {
      setIsUpdating(prev => ({ ...prev, [uid]: false }));
    }
  };

  const filteredUsers = useMemo(() => {
    if (filter === 'all') return users;
    return users.filter(user => user.status === filter);
  }, [users, filter]);

  if (currentUser?.role !== 'admin') {
    return null; // Or a dedicated access denied component
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2 flex items-center"><UserCog className="mr-3 h-8 w-8 text-primary" /> User Management</h1>
            <p className="text-muted-foreground">Approve or reject new user registrations.</p>
        </div>
        <div className="w-full sm:w-auto">
            <Select value={filter} onValueChange={(value) => setFilter(value as UserStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                    {statusFilters.map(status => (
                        <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {users.length} total users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>ID / Role</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}>
                            <Skeleton className="h-10 w-full" />
                        </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => {
                    const { icon: StatusIcon, color, variant } = statusConfig[user.status];
                    return (
                        <TableRow key={user.uid}>
                        <TableCell>
                          <div className="font-medium">{user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.uid}</div>
                        </TableCell>
                        <TableCell>
                           <div className="font-mono text-sm">{user.studentOrStaffId}</div>
                           <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                            {user.role === 'admin' ? <ShieldCheck className="h-3 w-3 mr-1" /> : null}
                            {user.role}
                           </Badge>
                        </TableCell>
                         <TableCell>
                            {format(user.createdAt instanceof Date ? user.createdAt : new Date(), 'PPp')}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={variant} className="items-center">
                            <StatusIcon className={`h-4 w-4 mr-1 ${color}`} />
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-600 text-green-600 hover:bg-green-100 hover:text-green-700"
                                onClick={() => handleUpdateStatus(user.uid, 'active')}
                                disabled={isUpdating[user.uid]}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-600 hover:bg-red-100 hover:text-red-700"
                                onClick={() => handleUpdateStatus(user.uid, 'rejected')}
                                disabled={isUpdating[user.uid]}
                              >
                                <XCircle className="mr-1 h-4 w-4" /> Reject
                              </Button>
                            </div>
                          )}
                           {user.status === 'rejected' && (
                               <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(user.uid, 'active')}
                                disabled={isUpdating[user.uid]}
                              >
                                Re-approve
                              </Button>
                           )}
                        </TableCell>
                      </TableRow>
                    );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No users found matching the filter.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
