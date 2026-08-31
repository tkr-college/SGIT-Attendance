import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await api.get('/admin/employees');
    setEmployees(data.employees);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/admin/employees/${editing}`, payload);
        toast.success('Employee updated');
      } else {
        await api.post('/admin/employees', form);
        toast.success('Employee created');
      }
      setForm({ name: '', email: '', password: '', role: 'employee' });
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed');
    }
  };

  const edit = (emp) => {
    setEditing(emp._id);
    setForm({ name: emp.name, email: emp.email, password: '', role: emp.role });
  };

  const remove = async (id) => {
    if (!confirm('Delete this employee?')) return;
    await api.delete(`/admin/employees/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggleActive = async (emp) => {
    await api.put(`/admin/employees/${emp._id}`, { isActive: !emp.isActive });
    load();
  };

  const unlockDevice = async (emp) => {
    await api.put(`/admin/employees/${emp._id}`, { deviceId: null });
    toast.success('Device unlocked');
    load();
  };

  return (
    <Layout title="Manage Employees">
      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={submit} className="card space-y-3 md:col-span-1 h-fit">
          <h2 className="font-semibold">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
          <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder={editing ? 'New password (optional)' : 'Password'} type="password" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex gap-2">
            <button className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
            {editing && (
              <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'employee' }); }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="card md:col-span-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Active</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-2 pr-4">{emp.name}</td>
                  <td className="py-2 pr-4">{emp.email}</td>
                  <td className="py-2 pr-4">{emp.employeeCode}</td>
                  <td className="py-2 pr-4">{emp.role}</td>
                  <td className="py-2 pr-4">
                    <button className="btn-secondary text-xs" onClick={() => toggleActive(emp)}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-2 pr-4 space-x-2 whitespace-nowrap">
                    <button className="text-brand-600 text-xs font-medium" onClick={() => edit(emp)}>Edit</button>
                    <button className="text-gray-500 text-xs font-medium" onClick={() => unlockDevice(emp)}>Unlock device</button>
                    <button className="text-red-600 text-xs font-medium" onClick={() => remove(emp._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
