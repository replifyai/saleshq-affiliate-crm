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
import { Search, RefreshCw, Package, Eye, ExternalLink, Layers, Plus, X, Trash2, Check, ImageIcon } from 'lucide-react';

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Collections</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-2">View and create product collections for creators</p>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, handle, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-400">
                {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collections Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
          </div>
        ) : filteredCollections.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Layers className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No collections found</h3>
                <p className="text-gray-500 dark:text-slate-400">
                  {searchQuery ? 'Try adjusting your search query' : 'Collections will appear here once creators create them'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <Card key={collection.id} className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {collection.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 dark:text-slate-400 font-mono mt-1 truncate">
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
                    <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2 mb-4">
                      {collection.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-slate-500 italic mb-4">
                      No description
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-4">
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
            <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-4">
                  <CardTitle className="text-xl">{selectedCollection.name}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-slate-400 font-mono mt-1">
                    /{selectedCollection.handle}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => { setShowModal(false); setCollectionProducts([]); }}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto space-y-6">
              {selectedCollection.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Description</label>
                  <p className="text-gray-900 dark:text-slate-100 mt-1">{selectedCollection.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Created</label>
                  <p className="text-gray-900 dark:text-slate-100 mt-1">{formatDate(selectedCollection.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Last Updated</label>
                  <p className="text-gray-900 dark:text-slate-100 mt-1">{formatDate(selectedCollection.updatedAt)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Created By</label>
                <p className="text-gray-900 dark:text-slate-100 mt-1 font-mono text-sm">{selectedCollection.createdBy}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-3">
                  Products ({selectedCollection.productIds.length})
                </label>
                {selectedCollection.productIds.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400 text-sm italic">No products in this collection</p>
                ) : collectionProductsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {collectionProducts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {collectionProducts.map((product) => (
                          <div
                            key={product.id}
                            className="relative p-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 group"
                          >
                            {/* External Link */}
                            <a
                              href={`https://admin.shopify.com/products/${extractProductId(product.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-1 right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <ExternalLink className="h-3 w-3 text-white" />
                            </a>
                            
                            {/* Product Image */}
                            <div className="w-full aspect-square rounded-md overflow-hidden bg-gray-100 dark:bg-slate-700 mb-2">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <p className="text-xs font-medium text-gray-900 dark:text-slate-100 truncate">
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
                              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate">
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
                            className="relative p-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 group"
                          >
                            <a
                              href={`https://admin.shopify.com/products/${extractProductId(productId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-1 right-1 w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ExternalLink className="h-3 w-3 text-white" />
                            </a>
                            <div className="w-full aspect-square rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold mb-1">
                              {index + 1}
                            </div>
                            <p className="text-xs font-mono text-gray-700 dark:text-slate-300 truncate text-center">
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
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Create New Collection</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
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
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-2">
                    Collection Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Summer Collection 2024"
                    value={newCollection.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-2">
                    Handle <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-slate-400 mr-1">/</span>
                    <Input
                      placeholder="summer-collection-2024"
                      value={newCollection.handle}
                      onChange={(e) => setNewCollection({ ...newCollection, handle: e.target.value })}
                      disabled={creating}
                      className="font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Auto-generated from name
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe this collection..."
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  disabled={creating}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
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
                  <div className="mb-4 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="p-3 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-6">
                          <Package className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500 dark:text-slate-400">
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
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 ring-2 ring-emerald-500'
                                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                              >
                                {/* Selection Indicator */}
                                {isSelected && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center z-10">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                  </div>
                                )}
                                
                                {/* Product Image */}
                                <div className="w-full aspect-square rounded overflow-hidden bg-gray-100 dark:bg-slate-700 mb-1">
                                  {product.images && product.images.length > 0 ? (
                                    <img
                                      src={product.images[0]}
                                      alt={product.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                {/* Product Info */}
                                <p className="text-[10px] font-medium text-gray-900 dark:text-slate-100 truncate leading-tight">
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
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Selected ({newCollection.productIds.length}):</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {newCollection.productIds.map((productId) => {
                        const product = allProducts.find(p => p.id === productId);
                        return (
                          <div
                            key={productId}
                            className="relative group flex items-center gap-1.5 pl-1 pr-5 py-1 bg-gray-100 dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700"
                          >
                            {product?.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                                <ImageIcon className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                            <span className="text-[10px] text-gray-700 dark:text-slate-300 truncate max-w-[80px]">
                              {product?.title || extractProductId(productId)}
                            </span>
                            <button
                              onClick={() => handleRemoveProductId(productId)}
                              disabled={creating}
                              className="absolute right-1 w-4 h-4 bg-gray-300 dark:bg-slate-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                            >
                              <X className="h-2.5 w-2.5 text-gray-600 dark:text-slate-300 hover:text-white" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {newCollection.productIds.length === 0 && !showProductPicker && (
                  <div className="text-center py-6 bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-slate-600">
                    <Package className="mx-auto h-8 w-8 text-gray-400 dark:text-slate-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      No products added yet. Click &quot;Browse Products&quot; to search and select.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <Button
                  onClick={handleCreateCollection}
                  disabled={creating || !newCollection.name.trim() || !newCollection.handle.trim()}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </DashboardLayout>
  );
}

