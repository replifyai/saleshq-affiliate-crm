'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { ProductCollection, ShopifyProduct } from '@/types';
import { formatDate } from '@/lib/utils';
import { Search, RefreshCw, Package, Eye, ExternalLink, Layers, Plus, X, Trash2, Check, ImageIcon, Edit3 } from 'lucide-react';

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

  useEffect(() => {
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
    if (allProducts.length > 0) return; // Already loaded
    try {
      setProductsLoading(true);
      const response = await apiClient.get<{ success: boolean; data: ShopifyProduct[] }>('/products');
      if (response.success && response.data) {
        // Ensure we always set an array
        setAllProducts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setAllProducts([]); // Ensure we have an array on error
    } finally {
      setProductsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    fetchProducts(); // Load products when modal opens
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

  const handleViewDetails = (collection: ProductCollection) => {
    setSelectedCollection(collection);
    setShowModal(true);
    fetchProductsByIds(collection.productIds);
  };

  const generateHandle = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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

  const extractProductId = (gid: string) => {
    // Extract just the ID from "gid://shopify/Product/1234567890"
    const parts = gid.split('/');
    return parts[parts.length - 1];
  };

  const filteredProducts = (Array.isArray(allProducts) ? allProducts : []).filter((product) => {
    if (!productSearchQuery) return true;
    const query = productSearchQuery.toLowerCase();
    return (
      product.title?.toLowerCase().includes(query) ||
      product.handle?.toLowerCase().includes(query) ||
      product.productType?.toLowerCase().includes(query) ||
      extractProductId(product.id).includes(query)
    );
  });

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim() || !newCollection.handle.trim()) {
      alert('Name and handle are required');
      return;
    }

    try {
      setCreating(true);
      const response = await apiClient.post<{ success: boolean; error?: string }>('/collections', newCollection);
      
      if (response.success) {
        alert('Collection created successfully');
        setShowCreateModal(false);
        setNewCollection(initialFormState);
        fetchCollections();
      } else {
        alert(response.error || 'Failed to create collection');
      }
    } catch (error: any) {
      console.error('Failed to create collection:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create collection';
      alert(`Error: ${errorMessage}`);
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

  // Edit collection functions
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

  const filteredEditProducts = (Array.isArray(allProducts) ? allProducts : []).filter((product) => {
    if (!editProductSearchQuery) return true;
    const query = editProductSearchQuery.toLowerCase();
    return (
      product.title?.toLowerCase().includes(query) ||
      product.handle?.toLowerCase().includes(query) ||
      product.productType?.toLowerCase().includes(query) ||
      extractProductId(product.id).includes(query)
    );
  });

  const handleUpdateCollection = async () => {
    if (!editingCollection || !editForm.name.trim() || !editForm.handle.trim()) {
      alert('Name and handle are required');
      return;
    }

    try {
      setEditing(true);
      const response = await apiClient.put<{ success: boolean; error?: string; data?: ProductCollection }>(
        `/collections/${editingCollection.id}`,
        editForm
      );
      
      if (response.success) {
        alert('Collection updated successfully');
        setShowEditModal(false);
        setEditingCollection(null);
        setEditForm(initialFormState);
        setEditProductSearchQuery('');
        setShowEditProductPicker(false);
        fetchCollections();
      } else {
        alert(response.error || 'Failed to update collection');
      }
    } catch (error: any) {
      console.error('Failed to update collection:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update collection';
      alert(`Error: ${errorMessage}`);
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

  // Delete collection functions
  const handleDeleteClick = (collection: ProductCollection) => {
    setCollectionToDelete(collection);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;

    try {
      setDeleting(true);
      const response = await apiClient.delete<{ success: boolean; error?: string; message?: string }>(
        `/collections/${collectionToDelete.id}`
      );
      
      if (response.success) {
        alert('Collection deleted successfully');
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
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete collection';
      alert(`Error: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setCollectionToDelete(null);
  };

  // Filter collections based on search query
  const filteredCollections = collections.filter((collection) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      collection.handle.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    );
  });

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Collections</h1>
            <p className="text-muted mt-2">View and create product collections for creators</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchCollections} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input
                  placeholder="Search by name, handle, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted">
                {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collections Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : filteredCollections.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Layers className="mx-auto h-12 w-12 text-muted mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No collections found</h3>
                <p className="text-muted">
                  {searchQuery ? 'Try adjusting your search query' : 'Collections will appear here once creators create them'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <Card key={collection.id} className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <div className="h-2 bg-brand-gradient" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate group-hover:text-accent transition-colors">
                        {collection.name}
                      </CardTitle>
                      <p className="text-sm text-muted font-mono mt-1 truncate">
                        /{collection.handle}
                      </p>
                    </div>
                    <Badge variant="default" className="ml-2 flex-shrink-0">
                      <Package className="h-3 w-3 mr-1" />
                      {collection.productIds.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {collection.description ? (
                    <p className="text-sm text-muted line-clamp-2 mb-4">
                      {collection.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted italic mb-4">
                      No description
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted mb-4">
                    <span>Created {formatDate(collection.createdAt)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(collection)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-[80%] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="h-2 bg-brand-gradient" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <CardTitle className="text-xl">{selectedCollection.name}</CardTitle>
                  <p className="text-sm text-muted font-mono mt-1">
                    /{selectedCollection.handle}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleOpenEditModal(selectedCollection)}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDeleteClick(selectedCollection)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowModal(false); setCollectionProducts([]); }}>Close</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto space-y-6">
              {selectedCollection.description && (
                <div>
                  <label className="text-sm font-medium text-muted">Description</label>
                  <p className="text-foreground mt-1">{selectedCollection.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted">Created</label>
                  <p className="text-foreground mt-1">{formatDate(selectedCollection.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted">Last Updated</label>
                  <p className="text-foreground mt-1">{formatDate(selectedCollection.updatedAt)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted">Created By</label>
                <p className="text-foreground mt-1 font-mono text-sm">{selectedCollection.createdBy}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted block mb-3">
                  Products ({selectedCollection.productIds.length})
                </label>
                {selectedCollection.productIds.length === 0 ? (
                  <p className="text-muted text-sm italic">No products in this collection</p>
                ) : collectionProductsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {collectionProducts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {collectionProducts.map((product) => (
                          <div
                            key={product.id}
                            className="relative p-2 bg-secondary rounded-lg border border-border group"
                          >
                            {/* External Link */}
                            <a
                              href={`https://admin.shopify.com/products/${extractProductId(product.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-1 right-1 w-6 h-6 bg-accent hover:bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <ExternalLink className="h-3 w-3 text-accent-foreground" />
                            </a>
                            
                            {/* Product Image */}
                            <div className="w-full aspect-square rounded-md overflow-hidden bg-white border border-border mb-2">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted" />
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <p className="text-xs font-medium text-foreground truncate">
                              {product.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge
                                variant={product.status === 'ACTIVE' ? 'success' : 'warning'}
                                className="text-xs"
                              >
                                {product.status}
                              </Badge>
                            </div>
                            {product.productType && (
                              <p className="text-xs text-muted mt-1 truncate">
                                {product.productType}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Fallback to showing just IDs if product details couldn't be loaded
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {selectedCollection.productIds.map((productId, index) => (
                          <div
                            key={productId}
                            className="relative p-2 bg-secondary rounded-lg border border-border group"
                          >
                            <a
                              href={`https://admin.shopify.com/products/${extractProductId(productId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-1 right-1 w-5 h-5 bg-accent hover:bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ExternalLink className="h-3 w-3 text-accent-foreground" />
                            </a>
                            <div className="w-full aspect-square rounded bg-brand-gradient flex items-center justify-center text-foreground text-lg font-bold mb-1">
                              {index + 1}
                            </div>
                            <p className="text-xs font-mono text-muted truncate text-center">
                              {extractProductId(productId)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-[80%] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="h-2 bg-brand-gradient" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Create New Collection</CardTitle>
                  <p className="text-sm text-muted mt-1">
                    Add a new product collection
                  </p>
                </div>
                <Button variant="ghost" onClick={handleCloseCreateModal} disabled={creating}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto space-y-6">
              {/* Name and Handle in two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Collection Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Summer Collection 2024"
                    value={newCollection.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Handle <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-muted mr-1">/</span>
                    <Input
                      placeholder="summer-collection-2024"
                      value={newCollection.handle}
                      onChange={(e) => setNewCollection({ ...newCollection, handle: e.target.value })}
                      disabled={creating}
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Auto-generated from name
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe this collection..."
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  disabled={creating}
                  className="w-full px-3 py-2 border border-border rounded-md bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Products ({newCollection.productIds.length} selected)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    disabled={creating}
                  >
                    {showProductPicker ? 'Hide Picker' : 'Browse Products'}
                  </Button>
                </div>

                {/* Product Picker */}
                {showProductPicker && (
                  <div className="mb-4 border border-border rounded-lg overflow-hidden">
                    <div className="p-3 bg-secondary border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <Input
                          placeholder="Search products by name, handle, or ID..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          className="pl-10"
                          disabled={creating}
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {productsLoading ? (
                        <div className="flex justify-center items-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-6">
                          <Package className="mx-auto h-6 w-6 text-muted mb-1" />
                          <p className="text-xs text-muted">
                            {productSearchQuery ? 'No products match your search' : 'No products available'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {filteredProducts.map((product) => {
                            const isSelected = newCollection.productIds.includes(product.id);
                            return (
                              <div
                                key={product.id}
                                onClick={() => !creating && toggleProductSelection(product.id)}
                                className={`relative p-1.5 rounded cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-primary/20 ring-2 ring-primary'
                                    : 'hover:bg-secondary'
                                }`}
                              >
                                {/* Selection Indicator */}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center z-10">
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                  </div>
                                )}
                                
                                {/* Product Image */}
                                <div className="w-full aspect-square rounded overflow-hidden bg-white border border-border mb-1">
                                  {product.images && product.images.length > 0 ? (
                                    <img
                                      src={product.images[0]}
                                      alt={product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-4 w-4 text-muted" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product Info */}
                                <p className="text-[10px] font-medium text-foreground truncate leading-tight">
                                  {product.title}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Selected Products Display */}
                {newCollection.productIds.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-1">Selected ({newCollection.productIds.length}):</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {newCollection.productIds.map((productId) => {
                        const product = allProducts.find(p => p.id === productId);
                        return (
                          <div
                            key={productId}
                            className="relative group flex items-center gap-1.5 pl-1 pr-5 py-1 bg-secondary rounded-full border border-border"
                          >
                            {product?.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center">
                                <ImageIcon className="h-3 w-3 text-muted" />
                              </div>
                            )}
                            <span className="text-[10px] text-foreground truncate max-w-[80px]">
                              {product?.title || extractProductId(productId)}
                            </span>
                            <button
                              onClick={() => handleRemoveProductId(productId)}
                              disabled={creating}
                              className="absolute right-1 w-4 h-4 bg-muted hover:bg-destructive rounded-full flex items-center justify-center transition-colors"
                            >
                              <X className="h-2.5 w-2.5 text-white" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {newCollection.productIds.length === 0 && !showProductPicker && (
                  <div className="text-center py-6 bg-secondary rounded-lg border border-dashed border-border">
                    <Package className="mx-auto h-8 w-8 text-muted mb-2" />
                    <p className="text-sm text-muted">
                      No products added yet. Click &quot;Browse Products&quot; to search and select.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={handleCreateCollection}
                  disabled={creating || !newCollection.name.trim() || !newCollection.handle.trim()}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Collection
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCloseCreateModal} disabled={creating}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Collection Modal */}
      {showEditModal && editingCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-[80%] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="h-2 bg-brand-gradient" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Edit Collection</CardTitle>
                  <p className="text-sm text-muted mt-1">
                    Update collection details
                  </p>
                </div>
                <Button variant="ghost" onClick={handleCloseEditModal} disabled={editing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto space-y-6">
              {/* Name and Handle in two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Collection Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Summer Collection 2024"
                    value={editForm.name}
                    onChange={(e) => handleEditNameChange(e.target.value)}
                    disabled={editing}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Handle <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-muted mr-1">/</span>
                    <Input
                      placeholder="summer-collection-2024"
                      value={editForm.handle}
                      onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                      disabled={editing}
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Auto-generated from name
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe this collection..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  disabled={editing}
                  className="w-full px-3 py-2 border border-border rounded-md bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Products ({editForm.productIds.length} selected)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditProductPicker(!showEditProductPicker)}
                    disabled={editing}
                  >
                    {showEditProductPicker ? 'Hide Picker' : 'Browse Products'}
                  </Button>
                </div>

                {/* Product Picker */}
                {showEditProductPicker && (
                  <div className="mb-4 border border-border rounded-lg overflow-hidden">
                    <div className="p-3 bg-secondary border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <Input
                          placeholder="Search products by name, handle, or ID..."
                          value={editProductSearchQuery}
                          onChange={(e) => setEditProductSearchQuery(e.target.value)}
                          className="pl-10"
                          disabled={editing}
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      {productsLoading ? (
                        <div className="flex justify-center items-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                        </div>
                      ) : filteredEditProducts.length === 0 ? (
                        <div className="text-center py-6">
                          <Package className="mx-auto h-6 w-6 text-muted mb-1" />
                          <p className="text-xs text-muted">
                            {editProductSearchQuery ? 'No products match your search' : 'No products available'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {filteredEditProducts.map((product) => {
                            const isSelected = editForm.productIds.includes(product.id);
                            return (
                              <div
                                key={product.id}
                                onClick={() => !editing && toggleEditProductSelection(product.id)}
                                className={`relative p-1.5 rounded cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-primary/20 ring-2 ring-primary'
                                    : 'hover:bg-secondary'
                                }`}
                              >
                                {/* Selection Indicator */}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center z-10">
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                  </div>
                                )}
                                
                                {/* Product Image */}
                                <div className="w-full aspect-square rounded overflow-hidden bg-white border border-border mb-1">
                                  {product.images && product.images.length > 0 ? (
                                    <img
                                      src={product.images[0]}
                                      alt={product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-4 w-4 text-muted" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product Info */}
                                <p className="text-[10px] font-medium text-foreground truncate leading-tight">
                                  {product.title}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Selected Products Display */}
                {editForm.productIds.length > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-1">Selected ({editForm.productIds.length}):</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {editForm.productIds.map((productId) => {
                        const product = allProducts.find(p => p.id === productId);
                        return (
                          <div
                            key={productId}
                            className="relative group flex items-center gap-1.5 pl-1 pr-5 py-1 bg-secondary rounded-full border border-border"
                          >
                            {product?.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center">
                                <ImageIcon className="h-3 w-3 text-muted" />
                              </div>
                            )}
                            <span className="text-[10px] text-foreground truncate max-w-[80px]">
                              {product?.title || extractProductId(productId)}
                            </span>
                            <button
                              onClick={() => handleEditRemoveProductId(productId)}
                              disabled={editing}
                              className="absolute right-1 w-4 h-4 bg-muted hover:bg-destructive rounded-full flex items-center justify-center transition-colors"
                            >
                              <X className="h-2.5 w-2.5 text-white" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {editForm.productIds.length === 0 && !showEditProductPicker && (
                  <div className="text-center py-6 bg-secondary rounded-lg border border-dashed border-border">
                    <Package className="mx-auto h-8 w-8 text-muted mb-2" />
                    <p className="text-sm text-muted">
                      No products in collection. Click &quot;Browse Products&quot; to add some.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={handleUpdateCollection}
                  disabled={editing || !editForm.name.trim() || !editForm.handle.trim()}
                  className="flex-1"
                >
                  {editing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Update Collection
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCloseEditModal} disabled={editing}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && collectionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <div className="h-2 bg-destructive" />
            <CardHeader>
              <CardTitle className="text-xl text-destructive">Delete Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Are you sure you want to delete <strong>{collectionToDelete.name}</strong>?
              </p>
              <p className="text-sm text-muted">
                This action cannot be undone. The collection and all its associations will be permanently removed.
              </p>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  variant="danger"
                  className="flex-1"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Collection
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancelDelete} disabled={deleting}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
