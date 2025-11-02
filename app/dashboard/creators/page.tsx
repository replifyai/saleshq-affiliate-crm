'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { apiClient } from '@/lib/api-client';
import { Creator, CreatorsResponse, CreatorStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { Check, X, Eye, Filter, RefreshCw, Phone, PhoneOff, ArrowUpDown } from 'lucide-react';

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<CreatorsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [approvedFilter, setApprovedFilter] = useState<CreatorStatus | 'all'>('all');
  const [phoneVerifiedFilter, setPhoneVerifiedFilter] = useState<boolean | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'email' | 'phoneNumber'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showModal, setShowModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  useEffect(() => {
    fetchCreators();
  }, [page, approvedFilter, phoneVerifiedFilter, sortBy, sortDirection]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      
      const requestBody = {
        page,
        pageSize,
        filters: {
          ...(approvedFilter !== 'all' && { approved: approvedFilter }),
          ...(phoneVerifiedFilter !== 'all' && { phoneNumberVerified: phoneVerifiedFilter }),
        },
        sort: {
          by: sortBy,
          direction: sortDirection,
        },
      };

      const response = await apiClient.post<{ success: boolean; data: CreatorsResponse }>('/creators', requestBody);
      
      if (response.success && response.data) {
        setCreators(response.data.items);
        setPagination(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovedFilterChange = (value: CreatorStatus | 'all') => {
    setApprovedFilter(value);
    setPage(1);
  };

  const handlePhoneVerifiedFilterChange = (value: string) => {
    if (value === 'all') {
      setPhoneVerifiedFilter('all');
    } else {
      setPhoneVerifiedFilter(value === 'true');
    }
    setPage(1);
  };

  const handleSortChange = (field: typeof sortBy) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setPage(1);
  };

  const handleApprove = async (creatorId: string) => {
    if (!confirm('Are you sure you want to approve this creator?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.put<{ success: boolean; message: string; data?: any }>(
        `/creators/${creatorId}/approve`
      );
      
      if (response.success) {
        await fetchCreators();
        alert('✓ Creator approved successfully!');
      } else {
        throw new Error(response.message || 'Failed to approve creator');
      }
    } catch (error: any) {
      console.error('Approve error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to approve creator';
      alert(`✗ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (creatorId: string) => {
    if (!confirm('Are you sure you want to reject this creator? This action can be undone by approving them again.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiClient.put<{ success: boolean; message: string; data?: any }>(
        `/creators/${creatorId}/reject`
      );
      
      if (response.success) {
        await fetchCreators();
        alert('✓ Creator rejected successfully!');
      } else {
        throw new Error(response.message || 'Failed to reject creator');
      }
    } catch (error: any) {
      console.error('Reject error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to reject creator';
      alert(`✗ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (creator: Creator) => {
    setSelectedCreator(creator);
    setShowModal(true);
  };

  const getStatusBadge = (status: CreatorStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
    }
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400 dark:text-slate-500 inline ml-1" />;
    return (
      <ArrowUpDown 
        className={`h-4 w-4 inline ml-1 ${sortDirection === 'desc' ? 'rotate-180' : ''}`}
      />
    );
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Creators</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">Manage creator profiles and approvals</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-slate-400" />
              <CardTitle className="text-lg">Filters & Sorting</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Select
                  label="Approval Status"
                  value={approvedFilter}
                  onChange={(e) => handleApprovedFilterChange(e.target.value as CreatorStatus | 'all')}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Select
                  label="Phone Verified"
                  value={phoneVerifiedFilter === 'all' ? 'all' : String(phoneVerifiedFilter)}
                  onChange={(e) => handlePhoneVerifiedFilterChange(e.target.value)}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'true', label: 'Verified' },
                    { value: 'false', label: 'Not Verified' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Select
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  options={[
                    { value: 'createdAt', label: 'Date Created' },
                    { value: 'name', label: 'Name' },
                    { value: 'email', label: 'Email' },
                    { value: 'phoneNumber', label: 'Phone Number' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Select
                  label="Sort Direction"
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                  options={[
                    { value: 'desc', label: 'Descending' },
                    { value: 'asc', label: 'Ascending' },
                  ]}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={fetchCreators} variant="outline" className="w-full md:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Creators Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Creators ({pagination?.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
              </div>
            ) : creators.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                No creators found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800">
                      <th 
                        className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                        onClick={() => handleSortChange('name')}
                      >
                        Name {getSortIcon('name')}
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                        onClick={() => handleSortChange('email')}
                      >
                        Email {getSortIcon('email')}
                      </th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                        onClick={() => handleSortChange('phoneNumber')}
                      >
                        Phone {getSortIcon('phoneNumber')}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Phone Verified</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Status</th>
                      <th 
                        className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                        onClick={() => handleSortChange('createdAt')}
                      >
                        Created {getSortIcon('createdAt')}
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creators.map((creator) => (
                      <tr key={creator.id} className="border-b border-gray-100 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800/50 group">
                        <td className="py-3 px-4 font-medium dark:text-slate-200 group-hover:text-black dark:group-hover:text-black">{creator.name}</td>
                        <td className="py-3 px-4 font-medium dark:text-slate-200 group-hover:text-black dark:group-hover:text-black">{creator.email}</td>
                        <td className="py-3 px-4 font-medium dark:text-slate-200 group-hover:text-black dark:group-hover:text-black">{creator.phoneNumber}</td>
                        <td className="py-3 px-4">
                          {creator.phoneNumberVerified ? (
                            <Badge variant="success">
                              <Phone className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="error">
                              <PhoneOff className="h-3 w-3 mr-1" />
                              Not Verified
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(creator.approved)}</td>
                        <td className="py-3 px-4 font-medium dark:text-slate-200 group-hover:text-black dark:group-hover:text-black">{formatDate(creator.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProfile(creator)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(creator.approved === 'pending' || creator.approved === 'rejected') && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(creator.id)}
                                title="Approve Creator"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {(creator.approved === 'pending' || creator.approved === 'approved') && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleReject(creator.id)}
                                title="Reject Creator"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total creators)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    Page {page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Modal */}
      {showModal && selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{selectedCreator.name} - Profile</CardTitle>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedCreator.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-gray-900">{selectedCreator.phoneNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusBadge(selectedCreator.approved)}
                    {(selectedCreator.approved === 'pending' || selectedCreator.approved === 'rejected') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          handleApprove(selectedCreator.id);
                          setShowModal(false);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {(selectedCreator.approved === 'pending' || selectedCreator.approved === 'approved') && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          handleReject(selectedCreator.id);
                          setShowModal(false);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone Verified</label>
                  <div className="mt-1">
                    {selectedCreator.phoneNumberVerified ? (
                      <Badge variant="success">
                        <Phone className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="error">
                        <PhoneOff className="h-3 w-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {selectedCreator.bio && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Bio</label>
                  <p className="text-gray-900">{selectedCreator.bio}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Social Media Handles</label>
                {selectedCreator.socialMediaHandles.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCreator.socialMediaHandles.map((social, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 capitalize w-24">
                          {social.platform}:
                        </span>
                        <span className="text-gray-900">{social.handle}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No social media handles</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="text-gray-900">{formatDate(selectedCreator.createdAt)}</p>
                </div>
                {selectedCreator.approvedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Approved</label>
                    <p className="text-gray-900">{formatDate(selectedCreator.approvedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}

