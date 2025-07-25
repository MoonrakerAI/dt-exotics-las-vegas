'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { CustomInvoice, InvoiceLineItem } from '../../types/rental'
import { formatCurrency } from '../../lib/rental-utils'
import { 
  Plus, 
  Receipt, 
  Edit, 
  Trash2, 
  Send, 
  Download, 
  Search, 
  Filter,
  Eye,
  DollarSign,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy
} from 'lucide-react'

interface InvoiceTableProps {
  invoices: CustomInvoice[]
  onEdit: (invoice: CustomInvoice) => void
  onView: (invoice: CustomInvoice) => void
  onSend: (invoice: CustomInvoice) => void
  onDelete: (invoice: CustomInvoice) => void
}

function InvoiceTable({ invoices, onEdit, onView, onSend, onDelete }: InvoiceTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-400" />
      case 'sent':
        return <Clock className="w-4 h-4 text-blue-400" />
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Receipt className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
      case 'sent': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'overdue': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'cancelled': return 'bg-gray-600/10 text-gray-500 border-gray-600/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <div className="glass-panel bg-dark-metal/20 border border-gray-600/30 rounded-2xl backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-metal/50 border-b border-gray-600/30">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Invoice</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Customer</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Due Date</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600/30">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-dark-metal/20 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium font-mono">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">
                      {invoice.customerDetails.name}
                    </p>
                    <p className="text-gray-400 text-sm">{invoice.customerDetails.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">
                      {formatCurrency(invoice.total)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white text-sm">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                    {new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && (
                      <p className="text-red-400 text-xs">Overdue</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    <span>{invoice.status.toUpperCase()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(invoice)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-metal/50 rounded-lg transition-colors"
                      title="View Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => onEdit(invoice)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-dark-metal/50 rounded-lg transition-colors"
                        title="Edit Invoice"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {(invoice.status === 'draft' || invoice.status === 'sent') && (
                      <button
                        onClick={() => onSend(invoice)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-dark-metal/50 rounded-lg transition-colors"
                        title="Send Invoice"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="p-2 text-gray-400 hover:text-green-400 hover:bg-dark-metal/50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {invoice.status === 'draft' && (
                      <button
                        onClick={() => onDelete(invoice)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-metal/50 rounded-lg transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function InvoicesAdmin() {
  const [invoices, setInvoices] = useState<CustomInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<CustomInvoice | null>(null)

  // New invoice form state
  const [newInvoice, setNewInvoice] = useState({
    customerDetails: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    lineItems: [] as InvoiceLineItem[],
    notes: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    taxRate: 8.25
  })

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const token = SimpleAuth.getToken()
      const response = await fetch('/api/admin/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = () => {
    setEditingInvoice(null)
    setNewInvoice({
      customerDetails: {
        name: '',
        email: '',
        phone: '',
        address: ''
      },
      lineItems: [],
      notes: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: 8.25
    })
    setShowCreateModal(true)
  }

  const handleEdit = (invoice: CustomInvoice) => {
    setEditingInvoice(invoice)
    setNewInvoice({
      customerDetails: invoice.customerDetails,
      lineItems: invoice.lineItems,
      notes: invoice.notes || '',
      dueDate: invoice.dueDate.split('T')[0],
      taxRate: invoice.taxRate || 8.25
    })
    setShowCreateModal(true)
  }

  const handleView = (invoice: CustomInvoice) => {
    // TODO: Open invoice view modal
    console.log('View invoice:', invoice)
  }

  const handleSend = (invoice: CustomInvoice) => {
    // TODO: Send invoice to customer
    console.log('Send invoice:', invoice)
  }

  const handleDelete = (invoice: CustomInvoice) => {
    // TODO: Delete invoice
    console.log('Delete invoice:', invoice)
  }

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
    setNewInvoice(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem]
    }))
  }

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    setNewInvoice(prev => {
      const items = [...prev.lineItems]
      items[index] = { ...items[index], [field]: value }
      
      // Recalculate total for this item
      if (field === 'quantity' || field === 'unitPrice') {
        items[index].total = items[index].quantity * items[index].unitPrice
      }
      
      return { ...prev, lineItems: items }
    })
  }

  const removeLineItem = (index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }))
  }

  const calculateSubtotal = () => {
    return newInvoice.lineItems.reduce((sum, item) => sum + item.total, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * (newInvoice.taxRate / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchQuery || 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerDetails.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    revenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0)
  }

  return (
    <div className="pt-8 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-panel bg-dark-metal/30 p-8 mb-8 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-tech font-bold text-white mb-4">
                Invoice <span className="neon-text">Management</span>
              </h1>
              <p className="text-xl text-gray-300">
                Create, send, and track custom invoices
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <button className="btn-secondary flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
              <button 
                onClick={handleCreateInvoice}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="glass-panel bg-dark-metal/20 p-4 border border-gray-600/30 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-white">{stats.total}</p>
            <p className="text-gray-400 text-sm">Total</p>
          </div>
          <div className="glass-panel bg-gray-500/10 p-4 border border-gray-500/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-gray-400">{stats.draft}</p>
            <p className="text-gray-300 text-sm">Draft</p>
          </div>
          <div className="glass-panel bg-blue-500/10 p-4 border border-blue-500/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-blue-400">{stats.sent}</p>
            <p className="text-blue-300 text-sm">Sent</p>
          </div>
          <div className="glass-panel bg-green-500/10 p-4 border border-green-500/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-green-400">{stats.paid}</p>
            <p className="text-green-300 text-sm">Paid</p>
          </div>
          <div className="glass-panel bg-red-500/10 p-4 border border-red-500/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-red-400">{stats.overdue}</p>
            <p className="text-red-300 text-sm">Overdue</p>
          </div>
          <div className="glass-panel bg-neon-blue/10 p-4 border border-neon-blue/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-neon-blue">{formatCurrency(stats.revenue)}</p>
            <p className="text-blue-300 text-sm">Revenue</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-panel bg-dark-metal/20 p-6 mb-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-neon-blue"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        {loading ? (
          <div className="glass-panel bg-dark-metal/20 p-12 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
            <p className="text-gray-300 mt-4">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="glass-panel bg-dark-metal/20 p-12 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">No invoices found</p>
            <p className="text-gray-400 mt-2">Create your first invoice to get started</p>
            <button 
              onClick={handleCreateInvoice}
              className="btn-primary mt-4"
            >
              Create Invoice
            </button>
          </div>
        ) : (
          <InvoiceTable
            invoices={filteredInvoices}
            onEdit={handleEdit}
            onView={handleView}
            onSend={handleSend}
            onDelete={handleDelete}
          />
        )}

        {/* Create/Edit Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel bg-dark-metal/90 border border-gray-600/30 rounded-2xl backdrop-blur-sm w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-tech font-bold text-white">
                    {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                  </h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-dark-metal/50 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Customer Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={newInvoice.customerDetails.name}
                        onChange={(e) => setNewInvoice(prev => ({
                          ...prev,
                          customerDetails: { ...prev.customerDetails, name: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={newInvoice.customerDetails.email}
                        onChange={(e) => setNewInvoice(prev => ({
                          ...prev,
                          customerDetails: { ...prev.customerDetails, email: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                        placeholder="customer@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newInvoice.customerDetails.phone}
                        onChange={(e) => setNewInvoice(prev => ({
                          ...prev,
                          customerDetails: { ...prev.customerDetails, phone: e.target.value }
                        }))}
                        className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-neon-blue"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={newInvoice.customerDetails.address}
                      onChange={(e) => setNewInvoice(prev => ({
                        ...prev,
                        customerDetails: { ...prev.customerDetails, address: e.target.value }
                      }))}
                      rows={2}
                      className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue resize-none"
                      placeholder="Customer address"
                    />
                  </div>

                  {/* Line Items */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-tech font-semibold text-white">
                        Line Items
                      </h3>
                      <button
                        onClick={addLineItem}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newInvoice.lineItems.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-5">
                            <label className="block text-xs text-gray-400 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-neon-blue"
                              placeholder="Item description"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-neon-blue"
                              min="1"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Unit Price</label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white text-sm focus:outline-none focus:border-neon-blue"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Total</label>
                            <div className="px-3 py-2 bg-gray-600/20 border border-gray-600/20 rounded-lg text-white text-sm">
                              {formatCurrency(item.total)}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <button
                              onClick={() => removeLineItem(index)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-metal/50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {newInvoice.lineItems.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-600/30 rounded-lg">
                        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">No items added yet</p>
                        <button
                          onClick={addLineItem}
                          className="text-neon-blue hover:text-blue-400 text-sm mt-2"
                        >
                          Add your first item
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tax and Totals */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        value={newInvoice.taxRate}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-neon-blue"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Subtotal:</span>
                        <span className="text-white font-medium">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Tax ({newInvoice.taxRate}%):</span>
                        <span className="text-white font-medium">{formatCurrency(calculateTax())}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-600/30">
                        <span className="text-white font-semibold">Total:</span>
                        <span className="text-neon-blue font-tech font-bold text-xl">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={newInvoice.notes}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue resize-none"
                      placeholder="Additional notes for the customer"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600/30">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-secondary"
                    >
                      Save as Draft
                    </button>
                    <button
                      className="btn-primary"
                    >
                      Create & Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}