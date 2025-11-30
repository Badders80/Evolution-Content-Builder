import { Plus, FileText, ArrowRight } from 'lucide-react';

export default function Dashboard({ onNewReport }: { onNewReport: () => void }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-fin-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-fin-text font-serif">Content Portfolio</h2>
          <p className="mt-1 text-sm text-fin-muted">Manage your investor updates and racing reports.</p>
        </div>
        <button 
          onClick={onNewReport}
          className="inline-flex items-center gap-2 rounded-md bg-fin-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-fin-primaryHover transition-all"
        >
          <Plus size={16} />
          Create New Asset
        </button>
      </div>

      {/* Stats / Quick Glance */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {['Drafts in Progress', 'Published this Month', 'Avg. Readability'].map((label, i) => (
          <div key={label} className="rounded-lg border border-fin-border bg-fin-bg p-6 shadow-financial">
            <p className="text-xs font-medium uppercase tracking-wider text-fin-muted">{label}</p>
            <p className="mt-2 text-3xl font-bold text-fin-text">
              {i === 0 ? '3' : i === 1 ? '12' : 'A+'}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Assets Ledger */}
      <div className="rounded-lg border border-fin-border bg-fin-bg shadow-financial overflow-hidden">
        <div className="border-b border-fin-border bg-fin-surface px-6 py-3 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-fin-text">Recent Ledger</h3>
          <span className="text-xs text-fin-muted">Last 30 Days</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-fin-surface text-fin-muted">
            <tr>
              <th className="px-6 py-3 font-medium">Document Name</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Audience</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fin-border">
            {[1, 2, 3].map((i) => (
              <tr key={i} className="group hover:bg-fin-surface/50 transition-colors">
                <td className="px-6 py-4 font-medium text-fin-text">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-fin-surface text-fin-muted border border-fin-border">
                      <FileText size={14} />
                    </div>
                    <span>First Gear - Post Race Report</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-fin-muted">Report</td>
                <td className="px-6 py-4 text-fin-muted">Investors</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">Draft</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-fin-primary hover:text-fin-primaryHover font-medium opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                    Edit <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
