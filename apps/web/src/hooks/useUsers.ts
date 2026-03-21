import { useState, useCallback } from 'react';
import { usersService, type UserSummary } from '../services/users.service';

export function useUsers() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { users, loading, fetchUsers };
}
