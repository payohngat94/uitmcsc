
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Hourglass, ShieldCheck, UserCog, AlertTriangle, Users, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { getAllUsers, updateUserStatus, deleteUser, approveAllPendingUsers } from '@/lib/firebase/firestore-service';
import type { UserProfile, UserStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<UserStatus | 'all'>('all');
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        const errorMessage = (err instanceof Error) ? err.message : 'An unknown error occurred.';
        if (errorMessage.includes("Firestore security rules")) {
          setError(errorMessage);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user data.' });
        }
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'You do not have permission to view this page.' });
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [currentUser, router, toast]);

  const handleUpdateStatus = async (docId: string, newStatus: UserStatus) => {
    if (!docId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot update user without a valid Document ID.' });
        return;
    }
    setIsUpdating(prev => ({ ...prev, [docId]: true }));
    try {
      await updateUserStatus(docId, newStatus);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.docId === docId ? { ...user, status: newStatus } : user
        )
      );
      toast({ title: 'Success', description: `User status updated to ${newStatus}.` });
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user status.' });
    } finally {
      setIsUpdating(prev => ({ ...prev, [docId]: false }));
    }
  };

  const handleApproveAll = async () => {
    setIsApprovingAll(true);
    try {
      const updatedDocIds = await approveAllPendingUsers();
      setUsers(prevUsers =>
        prevUsers.map(user =>
          updatedDocIds.includes(user.docId!) ? { ...user, status: 'active' } : user
        )
      );
      toast({ title: 'Success', description: `${updatedDocIds.length} pending users have been approved.` });
    } catch (error) {
      console.error('Failed to approve all users:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to approve all pending users.' });
    } finally {
      setIsApprovingAll(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete || !userToDelete.docId) return;

    try {
        await deleteUser(userToDelete.docId);
        setUsers(prevUsers => prevUsers.filter(user => user.docId !== userToDelete.docId));
        toast({ title: 'Success', description: `User ${userToDelete.email} has been deleted.` });
    } catch (error) {
        console.error('Failed to delete user:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete user.' });
    } finally {
        setUserToDelete(null);
    }
  };


  const filteredUsers = useMemo(() => {
    if (filter === 'all') return users;
    return users.filter(user => user.status === filter);
  }, [users, filter]);

  const pendingUsers = useMemo(() => {
    return users.filter(user => user.status === 'pending');
  }, [users]);
  
  const hasPendingUsers = pendingUsers.length > 0;

  if (currentUser?.role !== 'admin') {
    return null; 
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold font-headline mb-2 flex items-center"><UserCog className="mr-3 h-8 w-8 text-primary" /> User Management</h1>
            <p className="text-muted-foreground">Approve, reject, or delete user registrations.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {hasPendingUsers && (
              <Button onClick={handleApproveAll} disabled={isApprovingAll} className="w-full sm:w-auto">
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {isApprovingAll ? 'Approving...' : `Approve All Pending (${pendingUsers.length})`}
              </Button>
            )}
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
      
       {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Permission Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded">
              <p className="font-semibold">How to fix:</p>
              <p>In your Firebase project, go to Firestore Database -&gt; Rules and ensure your rules allow admins to read the 'users' collection. A common rule is:</p>
              <pre className="mt-1 p-1 bg-black/10 rounded font-mono text-[10px]"><code>{`match /users/{userId} {\n  allow read: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';\n  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';\n  allow create: if request.auth != null;\n}`}</code></pre>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user profile for "{userToDelete?.email}". This does not delete their authentication record, only their access to this application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


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
                        <TableRow key={user.docId}>
                        <TableCell>
                          <div className="font-medium">{user.email || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{user.uid || 'No UID'}</div>
                        </TableCell>
                        <TableCell>
                           <div className="font-mono text-sm">{user.studentOrStaffId}</div>
                           <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                            {user.role === 'admin' ? <ShieldCheck className="h-3 w-3 mr-1" /> : null}
                            {user.role}
                           </Badge>
                        </TableCell>
                         <TableCell>
                            {user.createdAt ? format(user.createdAt instanceof Date ? user.createdAt : new Date(), 'PPp') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={variant} className="items-center">
                            <StatusIcon className={`h-4 w-4 mr-1 ${color}`} />
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {user.status === 'pending' && user.docId && (
                                <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-600 text-green-600 hover:bg-green-100 hover:text-green-700"
                                    onClick={() => handleUpdateStatus(user.docId!, 'active')}
                                    disabled={isUpdating[user.docId!] || isApprovingAll}
                                >
                                    <CheckCircle className="mr-1 h-4 w-4" /> Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-600 text-red-600 hover:bg-red-100 hover:text-red-700"
                                    onClick={() => handleUpdateStatus(user.docId!, 'rejected')}
                                    disabled={isUpdating[user.docId!] || isApprovingAll}
                                >
                                    <XCircle className="mr-1 h-4 w-4" /> Reject
                                </Button>
                                </>
                            )}
                            {user.status === 'rejected' && user.docId && (
                                <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(user.docId!, 'active')}
                                disabled={isUpdating[user.docId!]}
                                >
                                Re-approve
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="destructive"
                                className="border-destructive text-destructive-foreground bg-destructive/90 hover:bg-destructive"
                                onClick={() => setUserToDelete(user)}
                                disabled={isUpdating[user.docId!]}
                            >
                                <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                          </div>
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
