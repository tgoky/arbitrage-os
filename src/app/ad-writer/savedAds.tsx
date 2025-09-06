"use client";

import { useSavedAds, SavedAd } from "../hooks/useSavedAd";
import { useWorkspaceContext } from "../hooks/useWorkspaceContext";
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Spin,
  Modal,
  List,
  Typography,
  Space,
  Tag,
  message,
  Tooltip,
  Alert,
  Select,
  Divider,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CopyOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { GeneratedAd, FullScript } from "@/types/adWriter";

const { Title, Text } = Typography;
const { Option } = Select;

export const SavedAdsHistory = () => {
  const { ads, loading, fetchAds } = useSavedAds();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAd, setSelectedAd] = useState<SavedAd | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<"createdAt" | "title">("createdAt");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const pageSize = 1;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchAds();
    }
  }, [fetchAds, isWorkspaceReady, currentWorkspace?.id]);

  const showAdDetails = (ad: SavedAd) => {
    setSelectedAd(ad);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedAd(null);
  };

  const handleDeleteAd = (adId: string) => {
    Modal.confirm({
      title: "Delete Ad",
      content: "Are you sure you want to delete this ad? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/ad-writer/saved?adId=${adId}`, {
            method: "DELETE",
          });
          if (response.ok) {
            await fetchAds();
            message.success("Ad deleted successfully");
            if (selectedAd?.id === adId) {
              handleModalClose();
            }
            // Adjust page if the last ad on the current page is deleted
            if (ads.length % pageSize === 1 && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          } else {
            throw new Error("Failed to delete ad");
          }
        } catch (error) {
          console.error("Delete ad error:", error);
          message.error("Failed to delete ad");
        }
      },
    });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success("Text copied to clipboard!");
    }).catch(() => {
      message.error("Failed to copy text");
    });
  };

  // Sort ads based on sortKey and sortOrder
  const sortedAds = [...ads].sort((a, b) => {
    if (sortKey === "title") {
      return sortOrder === "ascend"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    // Default to createdAt
    return sortOrder === "ascend"
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Paginate ads
  const paginatedAds = sortedAds.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <Spin size="large" />
        <p className="mt-4">Loading workspace...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert
          message="Workspace Required"
          description="The ad history must be accessed from within a workspace. Please navigate to a workspace first."
          type="error"
          showIcon
          action={
            <Button key="dashboard" type="primary" href="/dashboard">
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card
        title="Your Saved Ads"
        extra={
          <Space>
            <Select
              value={`${sortKey}-${sortOrder}`}
              style={{ width: 180 }}
              onChange={(value) => {
                const [key, order] = value.split("-") as [
                  "createdAt" | "title",
                  "ascend" | "descend"
                ];
                setSortKey(key);
                setSortOrder(order);
                setCurrentPage(1); // Reset to first page on sort change
              }}
            >
              <Option value="createdAt-descend">Newest First</Option>
              <Option value="createdAt-ascend">Oldest First</Option>
              <Option value="title-ascend">Title A-Z</Option>
              <Option value="title-descend">Title Z-A</Option>
            </Select>
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchAds();
                setCurrentPage(1); // Reset to first page on refresh
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">Loading your ads...</div>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12">
            <HistoryOutlined style={{ fontSize: "48px", color: "#ccc" }} />
            <Title level={4} type="secondary">
              No Saved Ads Yet
            </Title>
            <Text type="secondary">Your generated ads will appear here once you save them.</Text>
            <div className="mt-4">
              <Button key="create-ad" type="primary" href="/ad-writer">
                Create Your First Ad
              </Button>
            </div>
          </div>
        ) : (
          <List
            dataSource={paginatedAds}
            renderItem={(ad: SavedAd) => (
              <List.Item>
                <Card
                  key={ad.id}
                  size="small"
                  className="border-l-4 border-l-blue-500 w-full"
                  title={
                    <div className="flex justify-between items-center">
                      <div>
                        <Text strong>{ad.title}</Text>
                        <div className="text-sm text-gray-500">
                          <Tag color="blue">{ad.metadata.businessName}</Tag>
                          <Tag color="green">{ad.metadata.offerName}</Tag>
                          {selectedAd?.id === ad.id && (
                            <Tag color="gold">Currently Viewing</Tag>
                          )}
                        </div>
                      </div>
                      <Space>
                        <Tooltip title="View this ad">
                          <Button
                            key="view"
                            size="small"
                            type={selectedAd?.id === ad.id ? "primary" : "default"}
                            icon={<EyeOutlined />}
                            onClick={() => showAdDetails(ad)}
                          >
                            View
                          </Button>
                        </Tooltip>
                        <Tooltip title="Delete this ad">
                          <Button
                            key="delete"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteAd(ad.id)}
                          >
                            Delete
                          </Button>
                        </Tooltip>
                      </Space>
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
                    <div>
                      <Text className="text-sm font-medium">Platforms:</Text>
                      <div className="mt-1">
                        {ad.metadata.platforms?.map((platform, idx) => (
                          <Tag key={idx} color="purple">
                            {platform}
                          </Tag>
                        )) || <Text type="secondary">Not specified</Text>}
                      </div>
                    </div>
                    <div>
                      <Text className="text-sm font-medium">Created:</Text>
                      <div className="mt-1 text-sm">
                        {new Date(ad.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <Text className="text-sm font-medium">Ad Count:</Text>
                      <div className="mt-1 text-sm">
                        {ad.metadata.adCount || <Text type="secondary">Not specified</Text>}
                      </div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
            pagination={{
              current: currentPage,
              pageSize,
              total: ads.length,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false,
              position: "bottom",
              align: "center",
            }}
          />
        )}
      </Card>

      <Modal
        title={selectedAd?.title || "Ad Details"}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedAd && (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {selectedAd.content.ads.map((ad: GeneratedAd, index: number) => (
              <Card
                key={index}
                title={`Platform: ${ad.platform.charAt(0).toUpperCase() + ad.platform.slice(1)}`}
                style={{ marginBottom: "16px", borderRadius: "8px" , }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {/* Full Scripts Section - Moved to the top */}
                  {Array.isArray(ad.fullScripts) && ad.fullScripts.length > 0 && (
                    <>
                      <Title level={5}>Full Scripts</Title>
                      <List<FullScript>
                        dataSource={ad.fullScripts}
                        renderItem={(script: FullScript, idx: number) => (
                          <List.Item
                            actions={[
                              <Button
                                key={`copy-script-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(script.script)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            <div className="w-full">
                              <Text strong>{script.framework}</Text>
                              <Card
                                className="mt-2 bg-yellow-50 border-yellow-200"
                                bodyStyle={{
                                  padding: "12px",
                                  fontFamily: "'Courier New', monospace",
                                  backgroundColor: "#ffffe0",
                                  borderLeft: "4px solid #fadb14",
                                  color: "black",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                }}
                              >
                                <pre style={{ 
                                  whiteSpace: "pre-wrap", 
                                  margin: 0,
                                  lineHeight: "1.5",
                                  fontSize: "14px"
                                }}>
                                  {script.script}
                                </pre>
                              </Card>
                            </div>
                          </List.Item>
                        )}
                      />
                      <Divider />
                    </>
                  )}
                  
                  {/* Other sections follow */}
                  {Array.isArray(ad.headlines) && ad.headlines.length > 0 && (
                    <>
                      <Title level={5}>Headlines</Title>
                      <List<string>
                        dataSource={ad.headlines}
                        renderItem={(item: string, idx: number) => (
                          <List.Item
                          
                            actions={[
                              <Button
                                key={`copy-headline-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(item)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                  {Array.isArray(ad.descriptions) && ad.descriptions.length > 0 && (
                    <>
                      <Title level={5}>Descriptions</Title>
                      <List<string>
                        dataSource={ad.descriptions}
                        renderItem={(item: string, idx: number) => (
                          <List.Item
                 
                            actions={[
                              <Button
                                key={`copy-description-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(item)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                  {Array.isArray(ad.ctas) && ad.ctas.length > 0 && (
                    <>
                      <Title level={5}>Call-to-Actions</Title>
                      <List<string>
                        dataSource={ad.ctas}
                        renderItem={(item: string, idx: number) => (
                          <List.Item

                            actions={[
                              <Button
                                key={`copy-cta-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(item)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                  {Array.isArray(ad.hooks) && ad.hooks.length > 0 && (
                    <>
                      <Title level={5}>Hooks</Title>
                      <List<string>
                        dataSource={ad.hooks}
                        renderItem={(item: string, idx: number) => (
                          <List.Item
                     
                            actions={[
                              <Button
                                key={`copy-hook-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(item)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                  {Array.isArray(ad.visualSuggestions) && ad.visualSuggestions.length > 0 && (
                    <>
                      <Title level={5}>Visual Suggestions</Title>
                      <List<string>
                        dataSource={ad.visualSuggestions}
                        renderItem={(item: string, idx: number) => (
                          <List.Item
     
                            actions={[
                              <Button
                                key={`copy-visual-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(item)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                  {Array.isArray(ad.fixes) && ad.fixes.length > 0 && (
                    <>
                      <Title level={5}>Fixes</Title>
                      <List<string>
                        dataSource={ad.fixes}
                        renderItem={(item: string, idx: number) => (
                          <List.Item
            
                            actions={[
                              <Button
                                key={`copy-fix-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(item)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                  {Array.isArray(ad.results) && ad.results.length > 0 && (
                    <>
                      <Title level={5}>Results</Title>
                      <List<string>
                        dataSource={ad.results}
                        renderItem={(item: string, idx: number) => (
                          <List.Item
                    
                            actions={[
                              <Button
                                key={`copy-result-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(item)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                  {Array.isArray(ad.proofs) && ad.proofs.length > 0 && (
                    <>
                      <Title level={5}>Proofs</Title>
                      <List<string>
                        dataSource={ad.proofs}
                        renderItem={(item: string, idx: number) => (
                          <List.Item
                              style={{}}
                            actions={[
                              <Button
                                key={`copy-proof-${idx}`}
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(item)}
                              >
                                Copy
                              </Button>,
                            ]}
                          >
                            {item}
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                </Space>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};