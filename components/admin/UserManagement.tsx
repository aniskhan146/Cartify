import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRoleInfo, UserRole } from '../../types';
import { onAllUsersAndRolesValueChange, updateUserRole, setUserBanStatus, deleteUserRecord } from '../../services/databaseService';
import { MoreVerticalIcon } from '../shared/icons';
import ConfirmationModal from './ConfirmationModal';
import { cn } from '../../lib/utils';

const UserManagement: React.FC = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<UserRoleInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToModify, setUserToModify] = useState<UserRoleInfo | null>(null);
    const [confirmationAction, setConfirmationAction] = useState<'delete' | 'ban' | 'unban' | null>(null);

    useEffect(() => {
        const unsubscribe = onAllUsersAndRolesValueChange((allUsers) => {
            setUsers(allUsers);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (uid: string, newRole: UserRole) => {
        try {
            await updateUserRole(uid, newRole);
            // The real-time listener will automatically update the UI state.
        } catch (err) {
            console.error("Failed to update role:", err);
            setError('Failed to update user role. Please try again.');
        }
    };
    
    const handleBanToggle = (user: UserRoleInfo) => {
        setUserToModify(user);
        setConfirmationAction(user.isBanned ? 'unban' : 'ban');
        setIsConfirmModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleDeleteClick = (user: UserRoleInfo) => {
        setUserToModify(user);
        setConfirmationAction('delete');
        setIsConfirmModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleConfirmAction = async () => {
        if (!userToModify || !confirmationAction) return;
        
        try {
            if (confirmationAction === 'delete') {
                await deleteUserRecord(userToModify.uid);
            } else if (confirmationAction === 'ban' || confirmationAction === 'unban') {
                await setUserBanStatus(userToModify.uid, confirmationAction === 'ban');
            }
        } catch (err) {
            console.error(`Failed to ${confirmationAction} user:`, err);
            setError(`Failed to ${confirmationAction} user. Please try again.`);
        } finally {
            setIsConfirmModalOpen(false);
            setUserToModify(null);
            setConfirmationAction(null);
        }
    };
    
    const getConfirmationDetails = () => {
        if (!userToModify || !confirmationAction) return { title: '', message: '', text: '', variant: 'primary' };
        switch (confirmationAction) {
            case 'delete':
                return {
                    title: 'Delete User',
                    message: `Are you sure you want to delete the user "${userToModify.email}"? This will remove their data from the database but not from Firebase Auth. This action cannot be undone.`,
                    text: 'Confirm Delete',
                    variant: 'destructive'
                };
            case 'ban':
                return {
                    title: 'Ban User',
                    message: `Are you sure you want to ban "${userToModify.email}"? They will not be able to log in.`,
                    text: 'Confirm Ban',
                    variant: 'warning'
                };
            case 'unban':
                 return {
                    title: 'Unban User',
                    message: `Are you sure you want to unban "${userToModify.email}"? They will be able to log in again.`,
                    text: 'Confirm Unban',
                    variant: 'primary'
                };
            default:
                return { title: '', message: '', text: '', variant: 'primary' };
        }
    };


    const RoleSelector: React.FC<{ user: UserRoleInfo }> = ({ user }) => {
        const isSelf = currentUser?.uid === user.uid;
        const isSuperAdmin = user.uid === 'MiaPLwEX7MRy4Mm7O2DNyWVr07T2';
        
        const isDisabled = isSelf || isSuperAdmin;
        const disabledTooltip = isSelf 
            ? "You cannot change your own role." 
            : "This is the primary admin and their role cannot be changed.";

        return (
            <div className="relative" title={isDisabled ? disabledTooltip : ''}>
                <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                    disabled={isDisabled}
                    className={`bg-background border border-input rounded-md py-1 px-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring ${isDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
                    aria-label={`Role for ${user.email}`}
                >
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>
            </div>
        );
    };

    return (
        <>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmAction}
                title={getConfirmationDetails().title}
                message={getConfirmationDetails().message}
                confirmButtonText={getConfirmationDetails().text}
                confirmButtonVariant={getConfirmationDetails().variant as any}
            />

            <h1 className="text-2xl font-bold text-foreground mb-6">User Management</h1>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-x-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                ) : (
                    <table className="w-full min-w-[600px] text-sm text-left text-muted-foreground">
                        <thead className="text-xs text-foreground uppercase bg-muted">
                            <tr>
                                <th scope="col" className="px-4 py-3">User Email</th>
                                <th scope="col" className="px-4 py-3">User ID</th>
                                <th scope="col" className="px-4 py-3">Role</th>
                                <th scope="col" className="px-4 py-3 text-center">Status</th>
                                <th scope="col" className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const isSelf = currentUser?.uid === user.uid;
                                const isSuperAdmin = user.uid === 'MiaPLwEX7MRy4Mm7O2DNyWVr07T2';
                                const canModify = !isSelf && !isSuperAdmin;

                                return (
                                <tr key={user.uid} className={cn("bg-card border-b border-border hover:bg-accent", user.isBanned && "bg-red-500/10")}>
                                    <td className={cn("px-4 py-3 font-medium text-foreground", user.isBanned && "line-through")}>{user.email}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{user.uid}</td>
                                    <td className="px-4 py-3">
                                        <RoleSelector user={user} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={cn(
                                            "px-2 py-1 text-xs font-medium rounded-full",
                                            user.isBanned ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                                        )}>
                                            {user.isBanned ? 'Banned' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {canModify ? (
                                            <div className="relative inline-block text-left">
                                                <button onClick={() => setOpenActionMenu(openActionMenu === user.uid ? null : user.uid)} className="p-1 rounded-full hover:bg-muted focus:outline-none">
                                                    <MoreVerticalIcon className="h-5 w-5" />
                                                </button>
                                                {openActionMenu === user.uid && (
                                                    <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card ring-1 ring-border z-10">
                                                        <div className="py-1">
                                                            <a href="#" onClick={(e) => { e.preventDefault(); handleBanToggle(user); }} className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">{user.isBanned ? 'Unban User' : 'Ban User'}</a>
                                                            <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteClick(user); }} className="block px-4 py-2 text-sm text-destructive hover:bg-destructive/10">Delete User</a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs italic text-muted-foreground/50">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
};

export default UserManagement;