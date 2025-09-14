import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { Label } from '../ui/label.jsx';
import { Loader2 } from 'lucide-react';
import { updateUserRole } from '../../api/EcommerceApi.js';
import { useNotification } from '../../hooks/useNotification.jsx';

const EditUserRoleDialog = ({ user, isOpen, setIsOpen, onSuccess }) => {
  const [newRole, setNewRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (user) {
      setNewRole(user.role || 'user');
    }
  }, [user]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateUserRole(user.id, newRole);
      addNotification({ type: 'success', title: 'Role Updated', message: `${user.email}'s role has been changed to ${newRole}.` });
      onSuccess();
      setIsOpen(false);
    } catch (error) {
      addNotification({ type: 'error', title: 'Update Failed', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-effect text-white border-white/20">
        <DialogHeader>
          <DialogTitle>Edit Role for {user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="role-select">User Role</Label>
                <select
                    id="role-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-gradient-to-r from-purple-500 to-pink-500">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserRoleDialog;
