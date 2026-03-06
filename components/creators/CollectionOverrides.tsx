'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ProductCollection, ShopifyProduct } from '@/types';
import { Search, Plus, X, Box, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

interface CollectionOverridesProps {
    creatorId: string;
}

export function CollectionOverrides({ creatorId }: CollectionOverridesProps) {
    const [collections, setCollections] = useState<ProductCollection[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

    // Products currently resolved for the creator and collection
    const [resolvedProducts, setResolvedProducts] = useState<ShopifyProduct[]>([]);

    // Track specific overrides applied locally before saving
    const [addedProductIds, setAddedProductIds] = useState<string[]>([]);
    const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);

    // Product search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ShopifyProduct[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [allProducts, setAllProducts] = useState<ShopifyProduct[]>([]);

    // Loading states
    const [loadingCollections, setLoadingCollections] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // 1. Fetch available collections and all products on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoadingCollections(true);
                const [collectionsRes, productsRes] = await Promise.all([
                    apiClient.get<{ success: boolean; data: ProductCollection[] }>('/collections'),
                    apiClient.get<{ success: boolean; data: ShopifyProduct[] }>('/products')
                ]);

                if (collectionsRes.success && collectionsRes.data) {
                    setCollections(collectionsRes.data);
                }

                if (productsRes.success && productsRes.data) {
                    setAllProducts(productsRes.data);
                }
            } catch (err) {
                console.error('Failed to load initial data:', err);
                setError('Failed to load collections or products');
            } finally {
                setLoadingCollections(false);
            }
        };

        fetchInitialData();
    }, []);

    // 2. Fetch resolved products when collection selection changes
    useEffect(() => {
        const fetchResolvedProducts = async () => {
            if (!selectedCollectionId) {
                setResolvedProducts([]);
                setAddedProductIds([]);
                setRemovedProductIds([]);
                return;
            }

            try {
                setLoadingProducts(true);
                setError(null);
                setSuccessMsg(null);
                setAddedProductIds([]);
                setRemovedProductIds([]);

                const response = await apiClient.post<{ success: boolean; data: ShopifyProduct[] }>(
                    '/dashboard/admin/getResolvedProductsForCreator',
                    {
                        creatorId,
                        collectionId: selectedCollectionId
                    }
                );

                if (response.success && response.data) {
                    setResolvedProducts(response.data);
                } else {
                    setResolvedProducts([]);
                }
            } catch (err) {
                console.error('Failed to fetch resolved products:', err);
                setError('Failed to fetch resolved products for this collection');
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchResolvedProducts();
    }, [selectedCollectionId, creatorId]);

    // Handle searching products
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const debounceTimer = setTimeout(() => {
            const lowerQuery = searchQuery.toLowerCase();
            const results = allProducts.filter(p =>
                p.title.toLowerCase().includes(lowerQuery) ||
                p.handle.toLowerCase().includes(lowerQuery)
            );
            // Filter out products already in our resolved view
            const visibleIds = getVisibleProducts().map(p => p.id);
            setSearchResults(results.filter(p => !visibleIds.includes(p.id)).slice(0, 5)); // show top 5
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, allProducts]);

    // Compute the final visible products based on local pending overrides
    const getVisibleProducts = () => {
        // Start with the backend resolved products
        let visible = [...resolvedProducts];

        // Remove products they flagged for removal
        visible = visible.filter(p => !removedProductIds.includes(p.id));

        // Add products they flagged for addition
        const newlyAdded = allProducts.filter(p => addedProductIds.includes(p.id));
        visible = [...visible, ...newlyAdded];

        return visible;
    };

    const handleAddProduct = (product: ShopifyProduct) => {
        // If it was previously marked for removal, just un-remove it
        if (removedProductIds.includes(product.id)) {
            setRemovedProductIds(removedProductIds.filter(id => id !== product.id));
        } else if (!addedProductIds.includes(product.id)) {
            setAddedProductIds([...addedProductIds, product.id]);
        }
        setSearchQuery('');
    };

    const handleRemoveProduct = (productId: string) => {
        // If it was a newly added product, just un-add it
        if (addedProductIds.includes(productId)) {
            setAddedProductIds(addedProductIds.filter(id => id !== productId));
        } else if (!removedProductIds.includes(productId)) {
            setRemovedProductIds([...removedProductIds, productId]);
        }
    };

    const handleSave = async () => {
        if (!selectedCollectionId) return;

        try {
            setSaving(true);
            setError(null);
            setSuccessMsg(null);

            const response = await apiClient.post<{ success: boolean; error?: string }>('/dashboard/admin/setCreatorCollectionOverrides', {
                creatorId,
                collectionId: selectedCollectionId,
                addedProductIds,
                removedProductIds
            });

            if (response.success ?? true) { // some wrappers return straight data if ok
                setSuccessMsg('Overrides saved successfully!');
                // Keep the local state as is, or trigger a re-fetch of resolved products if desired
                // For smoother UX, we just leave the visual intact because `getVisibleProducts` handles it.
                // But to be completely in sync, we can re-fetch:
                setAddedProductIds([]);
                setRemovedProductIds([]);

                // Refresh resolved products
                const refreshReq = await apiClient.post<{ success: boolean; data: ShopifyProduct[] }>(
                    '/dashboard/admin/getResolvedProductsForCreator',
                    { creatorId, collectionId: selectedCollectionId }
                );
                if (refreshReq.success && refreshReq.data) {
                    setResolvedProducts(refreshReq.data);
                }
            } else {
                setError(response.error || 'Failed to save overrides');
            }
        } catch (err) {
            console.error('Save failed:', err);
            setError('An error occurred while saving overrides');
        } finally {
            setSaving(false);
        }
    };

    const hasChanges = addedProductIds.length > 0 || removedProductIds.length > 0;
    const visibleProducts = getVisibleProducts();

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-gray-400" />
                Collection Overrides
            </h3>

            <p className="text-sm text-gray-500 mb-5">
                Customize exactly which products this creator can promote within base collections.
            </p>

            {/* Collection Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Collection</label>
                {loadingCollections ? (
                    <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                ) : (
                    <select
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                        <option value="">-- Choose a collection --</option>
                        {collections.map(col => (
                            <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {selectedCollectionId && (
                <>
                    {/* Active Product List */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700">Resolved Products</label>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{visibleProducts.length} items</span>
                        </div>

                        {loadingProducts ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse w-full"></div>
                                ))}
                            </div>
                        ) : visibleProducts.length === 0 ? (
                            <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
                                <Box className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No products available in this collection for the creator.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {visibleProducts.map(product => {
                                    const isNewlyAdded = addedProductIds.includes(product.id);
                                    return (
                                        <div
                                            key={product.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${isNewlyAdded ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white shadow-sm'}`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Box className="w-5 h-5 m-auto text-gray-300 mt-2.5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate" title={product.title}>{product.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-gray-500 truncate max-w-[120px]" title={product.productType}>{product.productType || 'Product'}</span>
                                                        {isNewlyAdded && (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-sm">Added</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveProduct(product.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2 flex-shrink-0"
                                                title="Remove from collection for this creator"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Add Products Search */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Add Specific Products</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products by name to add..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            />

                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                </div>
                            )}

                            {/* Search Results Dropdown */}
                            {searchQuery.trim() && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                    {searchResults.map(result => (
                                        <button
                                            key={result.id}
                                            onClick={() => handleAddProduct(result)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                    {result.images?.[0] ? (
                                                        <img src={result.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Box className="w-4 h-4 m-auto text-gray-300 mt-2" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{result.productType}</p>
                                                </div>
                                            </div>
                                            <Plus className="w-4 h-4 text-gray-400" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center">
                                    <p className="text-sm text-gray-500">No unassigned products found matching "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                    {successMsg && <p className="text-sm text-green-600 mb-4">{successMsg}</p>}

                    {/* Action Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                            {hasChanges ? (
                                <span className="text-yellow-600 font-medium">{addedProductIds.length} additions, {removedProductIds.length} removals pending</span>
                            ) : (
                                <span>No unsaved changes</span>
                            )}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${hasChanges && !saving ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Save Overrides
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
