'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { MobileNavigation } from '@/components/mobile-navigation';

interface AuditLog {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  actor_staff_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: any;
  after: any;
  result: string | null;
  metadata: any;
  created_at: string;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction, filterEntity]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/audit/logs');
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view audit logs.');
        } else if (response.status === 401) {
          setError('Please log in to view audit logs.');
          router.push('/login');
        } else {
          setError(result.error || 'Failed to load audit logs');
        }
        return;
      }

      let filteredLogs = result.logs || [];
      
      if (filterAction) {
        filteredLogs = filteredLogs.filter((log: AuditLog) => 
          log.action.toLowerCase().includes(filterAction.toLowerCase())
        );
      }
      
      if (filterEntity) {
        filteredLogs = filteredLogs.filter((log: AuditLog) => 
          log.entity_type.toLowerCase().includes(filterEntity.toLowerCase())
        );
      }

      setLogs(filteredLogs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getResultColor = (result: string | null) => {
    switch (result) {
      case 'success': return 'text-green-600';
      case 'failure': return 'text-red-600';
      case 'partial': return 'text-amber-600';
      default: return 'text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Logo currentRole="admin" size="md" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Audit Logs</h1>
                <p className="text-xs text-slate-500">System activity history</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Desktop back button */}
              <button
                onClick={() => router.push('/dashboard')}
                className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Back to Dashboard
              </button>
              {/* Mobile Navigation */}
              <div className="md:hidden">
                <MobileNavigation currentRole="admin" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filters</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="filterAction" className="block text-sm font-medium text-slate-700 mb-2">
                Action
              </label>
              <input
                id="filterAction"
                type="text"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                placeholder="e.g., customer_created"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="filterEntity" className="block text-sm font-medium text-slate-700 mb-2">
                Entity Type
              </label>
              <input
                id="filterEntity"
                type="text"
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                placeholder="e.g., customer, card"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterAction(''); setFilterEntity(''); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No audit logs found</h3>
            <p className="text-slate-600">
              {filterAction || filterEntity ? 'Try adjusting your filters.' : 'No audit events have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date/Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Entity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actor Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {log.entity_type}
                        {log.entity_id && <span className="text-xs text-slate-400 ml-1">({log.entity_id.slice(0, 8)}...)</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {log.actor_role || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${getResultColor(log.result)}`}>
                          {log.result || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
