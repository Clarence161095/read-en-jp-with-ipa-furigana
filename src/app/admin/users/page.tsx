'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { articles: number };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({ username: '', email: '', password: '', role: 'user' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({ username: user.username, email: user.email, password: '', role: user.role });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const body: any = { username: form.username, email: form.email, role: form.role };
    if (form.password) body.password = form.password;

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    if (!editingUser && !form.password) {
      setError('Mật khẩu là bắt buộc');
      setSaving(false);
      return;
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Có lỗi xảy ra');
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    fetchUsers();
  };

  const handleDelete = async (user: User) => {
    if (user.id === session?.user?.id) {
      alert('Không thể xóa chính mình!');
      return;
    }
    if (!confirm(`Xóa người dùng "${user.username}"?`)) return;
    await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'admin': return { text: 'Admin', color: 'bg-red-50 text-red-600' };
      case 'editor': return { text: 'Editor', color: 'bg-blue-50 text-blue-600' };
      default: return { text: 'User', color: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="pb-20 lg:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Thêm mới
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse border">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Username</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-center px-4 py-3">Role</th>
                  <th className="text-center px-4 py-3">Bài viết</th>
                  <th className="text-right px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => {
                  const rl = roleLabel(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-sm">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${rl.color}`}>
                          {rl.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-500">{user._count.articles}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            ✏️
                          </button>
                          {user.id !== session?.user?.id && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {users.map((user) => {
              const rl = roleLabel(user.role);
              return (
                <div key={user.id} className="bg-white rounded-xl p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm">{user.username}</span>
                      <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full font-medium ${rl.color}`}>
                        {rl.text}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{user._count.articles} bài</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{user.email}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex-1 text-center py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                    >
                      Sửa
                    </button>
                    {user.id !== session?.user?.id && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="flex-1 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">
              {editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}
            </h2>

            {error && (
              <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu {editingUser ? '(để trống nếu không đổi)' : '*'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="user">User</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : editingUser ? 'Cập nhật' : 'Tạo'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
