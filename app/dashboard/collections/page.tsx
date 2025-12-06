'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FilterDrawer, FilterOption, FilterValues } from '@/components/ui/FilterDrawer';
import { apiClient } from '@/lib/api-client';
import { ProductCollection, ShopifyProduct } from '@/types';
import { formatDate } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  X, 
  Package, 
  Eye, 
  Edit3, 
  Trash2, 
  Check, 
  ImageIcon, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';

interface NewCollectionForm {
  name: string;
  handle: string;
  description: string;
  productIds: string[];
}

const initialFormState: NewCollectionForm = {
  name: '',
  handle: '',
  description: '',
  productIds: [],
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ProductCollection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCollection, setNewCollection] = useState<NewCollectionForm>(initialFormState);
  
  // Product picker state
  const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  
  // Collection details state
  const [collectionProducts, setCollectionProducts] = useState<ShopifyProduct[]>([]);
  const [collectionProductsLoading, setCollectionProductsLoading] = useState(false);
  
  // Edit collection state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ProductCollection | null>(null);
  const [editForm, setEditForm] = useState<NewCollectionForm>(initialFormState);
  const [editing, setEditing] = useState(false);
  const [editProductSearchQuery, setEditProductSearchQuery] = useState('');
  const [showEditProductPicker, setShowEditProductPicker] = useState(false);
  
  // Delete collection state
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<ProductCollection | null>(null);

  // Filter drawer state
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    dateRange: { from: '', to: '' },
    productCount: { min: 0, max: 100 },
    hasProducts: '',
  });

  // Filter options for collections
  const collectionFilters: FilterOption[] = [
    {
      id: 'dateRange',
      label: 'Created Date',
      type: 'daterange',
    },
    {
      id: 'productCount',
      label: 'Number of Products',
      type: 'range',
      min: 0,
      max: 100,
    },
    {
      id: 'hasProducts',
      label: 'Has Products',
      type: 'select',
      placeholder: 'All',
      options: [
        { value: 'yes', label: 'With Products' },
        { value: 'no', label: 'Empty Collections' },
      ],
    },
  ];

  const handleApplyFilters = (values: FilterValues) => {
    setFilterValues(values);
    setPage(1);
    console.log('Applied filters:', values);
  };

  const handleResetFilters = () => {
    setFilterValues({
      dateRange: { from: '', to: '' },
      productCount: { min: 0, max: 100 },
      hasProducts: '',
    });
  };

  useEffect(() => {
    setMounted(true);
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: ProductCollection[] }>('/collections');
      if (response.success && response.data) {
        setCollections(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (allProducts.length > 0) return;
    try {
      setProductsLoading(true);
      const response = await apiClient.get<{ success: boolean; data: ShopifyProduct[] }>('/products');
      if (response.success && response.data) {
        setAllProducts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setAllProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchProductsByIds = async (ids: string[]) => {
    if (ids.length === 0) {
      setCollectionProducts([]);
      return;
    }
    try {
      setCollectionProductsLoading(true);
      const response = await apiClient.post<{ success: boolean; data: ShopifyProduct[] }>('/products/by-ids', { ids });
      if (response.success && response.data) {
        setCollectionProducts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
      setCollectionProducts([]);
    } finally {
      setCollectionProductsLoading(false);
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const generateHandle = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const extractProductId = (gid: string) => {
    const parts = gid.split('/');
    return parts[parts.length - 1];
  };

  // Filter collections
  const filteredCollections = collections.filter((collection) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      collection.handle.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    );
  });

  // Paginated collections
  const totalPages = Math.ceil(filteredCollections.length / pageSize);
  const paginatedCollections = filteredCollections.slice((page - 1) * pageSize, page * pageSize);

  // Filter products for picker
  const filteredProducts = (Array.isArray(allProducts) ? allProducts : []).filter((product) => {
    if (!productSearchQuery) return true;
    const query = productSearchQuery.toLowerCase();
    return (
      product.title?.toLowerCase().includes(query) ||
      product.handle?.toLowerCase().includes(query) ||
      product.productType?.toLowerCase().includes(query)
    );
  });

  const filteredEditProducts = (Array.isArray(allProducts) ? allProducts : []).filter((product) => {
    if (!editProductSearchQuery) return true;
    const query = editProductSearchQuery.toLowerCase();
    return (
      product.title?.toLowerCase().includes(query) ||
      product.handle?.toLowerCase().includes(query) ||
      product.productType?.toLowerCase().includes(query)
    );
  });

  // Handlers
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    fetchProducts();
  };

  const handleViewDetails = (collection: ProductCollection) => {
    setSelectedCollection(collection);
    setShowModal(true);
    fetchProductsByIds(collection.productIds);
  };

  const handleNameChange = (name: string) => {
    setNewCollection({
      ...newCollection,
      name,
      handle: generateHandle(name),
    });
  };

  const handleRemoveProductId = (idToRemove: string) => {
    setNewCollection({
      ...newCollection,
      productIds: newCollection.productIds.filter((id) => id !== idToRemove),
    });
  };

  const toggleProductSelection = (productId: string) => {
    if (newCollection.productIds.includes(productId)) {
      handleRemoveProductId(productId);
    } else {
      setNewCollection({
        ...newCollection,
        productIds: [...newCollection.productIds, productId],
      });
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim() || !newCollection.handle.trim()) {
      alert('Name and handle are required');
      return;
    }

    try {
      setCreating(true);
      const response = await apiClient.post<{ success: boolean; error?: string }>('/collections', newCollection);
      
      if (response.success) {
        setShowCreateModal(false);
        setNewCollection(initialFormState);
        fetchCollections();
      } else {
        alert(response.error || 'Failed to create collection');
      }
    } catch (error: any) {
      console.error('Failed to create collection:', error);
      alert('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewCollection(initialFormState);
    setProductSearchQuery('');
    setShowProductPicker(false);
  };

  // Edit handlers
  const handleOpenEditModal = (collection: ProductCollection) => {
    setEditingCollection(collection);
    setEditForm({
      name: collection.name,
      handle: collection.handle,
      description: collection.description || '',
      productIds: [...collection.productIds],
    });
    setShowEditModal(true);
    setShowModal(false);
    fetchProducts();
  };

  const handleEditNameChange = (name: string) => {
    setEditForm({
      ...editForm,
      name,
      handle: generateHandle(name),
    });
  };

  const handleEditRemoveProductId = (idToRemove: string) => {
    setEditForm({
      ...editForm,
      productIds: editForm.productIds.filter((id) => id !== idToRemove),
    });
  };

  const toggleEditProductSelection = (productId: string) => {
    if (editForm.productIds.includes(productId)) {
      handleEditRemoveProductId(productId);
    } else {
      setEditForm({
        ...editForm,
        productIds: [...editForm.productIds, productId],
      });
    }
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection || !editForm.name.trim() || !editForm.handle.trim()) {
      alert('Name and handle are required');
      return;
    }

    try {
      setEditing(true);
      const response = await apiClient.put<{ success: boolean; error?: string }>(
        `/collections/${editingCollection.id}`,
        editForm
      );
      
      if (response.success) {
        setShowEditModal(false);
        setEditingCollection(null);
        setEditForm(initialFormState);
        fetchCollections();
      } else {
        alert(response.error || 'Failed to update collection');
      }
    } catch (error: any) {
      console.error('Failed to update collection:', error);
      alert('Failed to update collection');
    } finally {
      setEditing(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCollection(null);
    setEditForm(initialFormState);
    setEditProductSearchQuery('');
    setShowEditProductPicker(false);
  };

  // Delete handlers
  const handleDeleteClick = (collection: ProductCollection) => {
    setCollectionToDelete(collection);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;

    try {
      setDeleting(true);
      const response = await apiClient.delete<{ success: boolean; error?: string }>(
        `/collections/${collectionToDelete.id}`
      );
      
      if (response.success) {
        setShowDeleteConfirm(false);
        setCollectionToDelete(null);
        setShowModal(false);
        setSelectedCollection(null);
        setCollectionProducts([]);
        fetchCollections();
      } else {
        alert(response.error || 'Failed to delete collection');
      }
    } catch (error: any) {
      console.error('Failed to delete collection:', error);
      alert('Failed to delete collection');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Collections</h1>
          <span className="text-sm text-gray-500">
            Last refreshed: {mounted ? getCurrentTime() : '11:56 AM'}
          </span>
        </div>

        {/* Search and Actions Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search for a Collection"
                className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowFilterDrawer(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ArrowUpDown className="h-4 w-4" />
              Sort By
            </button>
          </div>
          
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Create Collection
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#EAC312]"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Handle</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Products</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Created</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCollections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <Package className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                      <p>No collections found</p>
                      <p className="text-sm mt-1">Create your first collection to get started</p>
                    </td>
                  </tr>
                ) : (
                  paginatedCollections.map((collection) => (
                    <tr 
                      key={collection.id} 
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{collection.name}</p>
                          {collection.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">{collection.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 font-mono">
                        /{collection.handle}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Package className="h-3 w-3 mr-1" />
                          {collection.productIds.length}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {formatDate(collection.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(collection)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(collection)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(collection)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 py-4 px-6 border-t border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page}/{totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showModal && selectedCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedCollection.name}</h2>
                <p className="text-sm text-gray-500 font-mono">/{selectedCollection.handle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(selectedCollection)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(selectedCollection)}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Delete
                </button>
                <button
                  onClick={() => { setShowModal(false); setCollectionProducts([]); }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {selectedCollection.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{selectedCollection.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900 mt-1">{formatDate(selectedCollection.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900 mt-1">{formatDate(selectedCollection.updatedAt)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 block mb-3">
                  Products ({selectedCollection.productIds.length})
                </label>
                {selectedCollection.productIds.length === 0 ? (
                  <p className="text-gray-500 text-sm">No products in this collection</p>
                ) : collectionProductsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-[#EAC312]"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {collectionProducts.map((product) => (
                      <div
                        key={product.id}
                        className="relative p-3 bg-gray-50 rounded-xl border border-gray-100 group"
                      >
                        <a
                          href={`https://admin.shopify.com/products/${extractProductId(product.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 right-2 w-6 h-6 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <ExternalLink className="h-3 w-3 text-gray-600" />
                        </a>
                        
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-white mb-2">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.title}
                        </p>
                        <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                          product.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create New Collection</h2>
                <p className="text-sm text-gray-500">Add a new product collection</p>
              </div>
              <button
                onClick={handleCloseCreateModal}
                disabled={creating}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Collection 2024"
                    value={newCollection.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={creating}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Handle <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">/</span>
                    <input
                      type="text"
                      placeholder="summer-collection-2024"
                      value={newCollection.handle}
                      onChange={(e) => setNewCollection({ ...newCollection, handle: e.target.value })}
                      disabled={creating}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Describe this collection..."
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  disabled={creating}
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Products ({newCollection.productIds.length} selected)
                  </label>
                  <button
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    disabled={creating}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showProductPicker ? 'Hide Picker' : 'Browse Products'}
                  </button>
                </div>

                {showProductPicker && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2">
                      {productsLoading ? (
                        <div className="flex justify-center items-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#EAC312]"></div>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm">No products found</div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {filteredProducts.slice(0, 20).map((product) => {
                            const isSelected = newCollection.productIds.includes(product.id);
                            return (
                              <div
                                key={product.id}
                                onClick={() => !creating && toggleProductSelection(product.id)}
                                className={`relative p-2 rounded-lg cursor-pointer transition-all ${
                                  isSelected ? 'bg-yellow-50 ring-2 ring-yellow-400' : 'hover:bg-gray-50'
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                                    <Check className="h-3 w-3 text-gray-900" />
                                  </div>
                                )}
                                <div className="w-full aspect-square rounded overflow-hidden bg-white border border-gray-100 mb-1">
                                  {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-4 w-4 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-gray-900 truncate">{product.title}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {newCollection.productIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newCollection.productIds.map((productId) => {
                      const product = allProducts.find(p => p.id === productId);
                      return (
                        <div key={productId} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                          <span className="text-xs text-gray-700 truncate max-w-[100px]">
                            {product?.title || extractProductId(productId)}
                          </span>
                          <button
                            onClick={() => handleRemoveProductId(productId)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleCreateCollection}
                disabled={creating || !newCollection.name.trim() || !newCollection.handle.trim()}
                className="w-full py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {showEditModal && editingCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit Collection</h2>
                <p className="text-sm text-gray-500">Update collection details</p>
              </div>
              <button
                onClick={handleCloseEditModal}
                disabled={editing}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditNameChange(e.target.value)}
                    disabled={editing}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Handle <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">/</span>
                    <input
                      type="text"
                      value={editForm.handle}
                      onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                      disabled={editing}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={editing}
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Products ({editForm.productIds.length} selected)
                  </label>
                  <button
                    onClick={() => setShowEditProductPicker(!showEditProductPicker)}
                    disabled={editing}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showEditProductPicker ? 'Hide Picker' : 'Browse Products'}
                  </button>
                </div>

                {showEditProductPicker && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={editProductSearchQuery}
                          onChange={(e) => setEditProductSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2">
                      {productsLoading ? (
                        <div className="flex justify-center items-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-[#EAC312]"></div>
                        </div>
                      ) : filteredEditProducts.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm">No products found</div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {filteredEditProducts.slice(0, 20).map((product) => {
                            const isSelected = editForm.productIds.includes(product.id);
                            return (
                              <div
                                key={product.id}
                                onClick={() => !editing && toggleEditProductSelection(product.id)}
                                className={`relative p-2 rounded-lg cursor-pointer transition-all ${
                                  isSelected ? 'bg-yellow-50 ring-2 ring-yellow-400' : 'hover:bg-gray-50'
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center z-10">
                                    <Check className="h-3 w-3 text-gray-900" />
                                  </div>
                                )}
                                <div className="w-full aspect-square rounded overflow-hidden bg-white border border-gray-100 mb-1">
                                  {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-4 w-4 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-gray-900 truncate">{product.title}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {editForm.productIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editForm.productIds.map((productId) => {
                      const product = allProducts.find(p => p.id === productId);
                      return (
                        <div key={productId} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                          <span className="text-xs text-gray-700 truncate max-w-[100px]">
                            {product?.title || extractProductId(productId)}
                          </span>
                          <button
                            onClick={() => handleEditRemoveProductId(productId)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleUpdateCollection}
                disabled={editing || !editForm.name.trim() || !editForm.handle.trim()}
                className="w-full py-3 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50"
              >
                {editing ? 'Updating...' : 'Update Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && collectionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Collection</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{collectionToDelete.name}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setCollectionToDelete(null); }}
                disabled={deleting}
                className="flex-1 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        title="Filter Collections"
        filters={collectionFilters}
        values={filterValues}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </DashboardLayout>
  );
}

