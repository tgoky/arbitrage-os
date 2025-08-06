"use client";

// app/top-niches/page.tsx
import React, { useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { Input, Table, Typography } from 'antd';

const { Title, Text } = Typography;

interface Niche {
  key: number;
  rank: number;
  niche: string;
  description: string;
  companies: string[];
  revenuePotential: string;
  easyToTarget: number;
  marketSophistication: number;
  cagr: string;
}

// Color palette for company tags
const TAG_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-teal-100 text-teal-800',
  'bg-orange-100 text-orange-800',
  'bg-amber-100 text-amber-800',
];

const NichesPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  
  const niches: Niche[] = [
    {
      key: 1,
      rank: 1,
      niche: 'AI Consulting Companies',
      description: 'Broad AI innovation & strategy for enterprises.',
      companies: ['DataRobot', 'Cognizant AI', 'Element AI'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 4,
      cagr: '30%'
    },
      {
      key: 2,
      rank: 1,
      niche: 'AI Consulting Companies',
      description: 'Broad AI innovation & strategy for enterprises.',
      companies: ['DataRobot', 'Cognizant AI', 'Element AI', 'Element AI'],
      revenuePotential: 'Yes',
      easyToTarget: 4,
      marketSophistication: 4,
      cagr: '30%'
    },
    // Add remaining niches...
  ];

  const filteredNiches = niches.filter(niche =>
    niche.niche.toLowerCase().includes(searchText.toLowerCase()) ||
    niche.description.toLowerCase().includes(searchText.toLowerCase()) ||
    niche.companies.some(company => company.toLowerCase().includes(searchText.toLowerCase()))
  );

  const renderRatingDots = (rating: number) => {
    return (
      <div className="flex items-center justify-center">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 rounded-full mx-0.5 ${i < rating ? 'bg-gray-800' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const renderCompanies = (companies: string[]) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {companies.map((company, index) => {
          const colorIndex = index % TAG_COLORS.length;
          return (
            <span 
              key={company}
              className={`px-3 py-1 rounded-full text-sm ${TAG_COLORS[colorIndex]}`}
            >
              {company}
            </span>
          );
        })}
      </div>
    );
  };

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      align: 'center' as const,
      sorter: (a: Niche, b: Niche) => a.rank - b.rank,
    },
    {
      title: 'Niche',
      dataIndex: 'niche',
      key: 'niche',
      render: (text: string, record: Niche) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-500 text-sm">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Example Companies',
      dataIndex: 'companies',
      key: 'companies',
      render: renderCompanies,
    },
    {
      title: '$1M+/Year',
      dataIndex: 'revenuePotential',
      key: 'revenuePotential',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Easy to Target',
      dataIndex: 'easyToTarget',
      key: 'easyToTarget',
      width: 120,
      render: renderRatingDots,
      align: 'center' as const,
    },
    {
      title: 'Market Sophistication',
      dataIndex: 'marketSophistication',
      key: 'marketSophistication',
      width: 150,
      render: renderRatingDots,
      align: 'center' as const,
    },
    {
      title: 'CAGR',
      dataIndex: 'cagr',
      key: 'cagr',
      width: 100,
      align: 'center' as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Centered Header Section */}
      <div className="mb-8 text-center">
        <Title level={2} className="mb-2">Top 50 Profitable Niches</Title>
        <Text type="secondary" className="text-lg block mb-4">
          Discover high-potential industries with detailed metrics on revenue potential, market size, and growth rates.
        </Text>
        
        {/* Centered Search Bar */}
        <div className="flex justify-center">
          <Input
            placeholder="Search niches..."
            prefix={<SearchOutlined />}
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-md w-full"
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredNiches}
        pagination={false}
        className="minimalist-table"
        bordered={false}
      />
    </div>
  );
};

export default NichesPage;