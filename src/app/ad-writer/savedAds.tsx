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
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

import { ConfigProvider } from "antd";

const { Title, Text } = Typography;
const { Option } = Select;

export const SavedAdsHistory = () => {
  const { ads, loading, fetchAds } = useSavedAds();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const router = useRouter();
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
    router.push(`/ad-writer/${ad.id}`);
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
       <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
  <Spin size="large" tip="Loading workspace..." />
</ConfigProvider>
        {/* <p className="mt-4"></p> */}
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
              <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#5CC49D',
        },
      }}
    >
      <Spin size="large" tip="Loading your ads..." />
    </ConfigProvider>
            {/* <div className="mt-4"></div> */}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12">
            <HistoryOutlined style={{ fontSize: "48px", color: "#ccc" }} />
            <Title level={4} type="secondary">
              No Saved Ads Yet
            </Title>
            <Text type="secondary">Your generated ads will appear here once you save them.</Text>
            <div className="mt-4">
              <Button key="create-ad" type="primary" href="/ad-writer"  
               style={{
    backgroundColor: '#5CC49D',
    borderColor: '#5CC49D',
    color: '#000000',
    fontWeight: '500'
  }}>
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
                        </div>
                      </div>
                      <Space>
                        <Tooltip title="View this ad">
                          <Button
                            key="view"
                            size="small"
                            type="default"
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

    </div>
  );
};