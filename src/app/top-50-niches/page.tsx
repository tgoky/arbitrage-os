"use client";

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
      niche: 'Small Law Firms & Legal Services',
      description: 'Legal services for individuals and small businesses',
      companies: ['Clio', 'RocketLawyer', 'Local Firms'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 2,
      rank: 2,
      niche: 'Independent Insurance Agencies',
      description: 'Insurance brokerage and policy services',
      companies: ['Applied Systems', 'Local Brokers'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 4,
      cagr: '10–14%'
    },
    {
      key: 3,
      rank: 3,
      niche: 'Medical Billing & Coding Firms',
      description: 'Healthcare billing and coding services',
      companies: ['Kareo', 'AdvancedMD'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '12–16%'
    },
    {
      key: 4,
      rank: 4,
      niche: 'Property Management Companies',
      description: 'Residential and commercial property management',
      companies: ['Buildium', 'AppFolio'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 5,
      rank: 5,
      niche: 'Construction & Contracting Firms',
      description: 'Construction project management and contracting',
      companies: ['Procore', 'SMB Contractors'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '10–15%'
    },
    {
      key: 6,
      rank: 6,
      niche: 'Local Logistics & Freight Brokers',
      description: 'Logistics and freight brokerage services',
      companies: ['CH Robinson', 'SMB Brokers'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 4,
      cagr: '12–18%'
    },
    {
      key: 7,
      rank: 7,
      niche: 'Specialty Healthcare Clinics',
      description: 'Specialized medical practices (dental, PT, chiropractic)',
      companies: ['Dental', 'PT', 'Chiropractic'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 3,
      cagr: '9–14%'
    },
    {
      key: 8,
      rank: 8,
      niche: 'Nonprofits & Associations',
      description: 'Nonprofit organizations and associations',
      companies: ['Blackbaud', 'Bloomerang'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '6–10%'
    },
    {
      key: 9,
      rank: 9,
      niche: 'Home Services (Plumbing, HVAC)',
      description: 'Home maintenance and repair services',
      companies: ['ServiceTitan', 'Housecall Pro'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '8–12%'
    },
    {
      key: 10,
      rank: 10,
      niche: 'Agriculture & Small Farms',
      description: 'Agricultural operations and small farming',
      companies: ['Trimble', 'Farmers Edge'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '10–15%'
    },
    {
      key: 11,
      rank: 11,
      niche: 'Auto Dealership Groups',
      description: 'Automobile sales and service',
      companies: ['Dealertrack', 'CDK Global'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 4,
      cagr: '8–12%'
    },
    {
      key: 12,
      rank: 12,
      niche: 'Mortgage & Loan Brokers',
      description: 'Mortgage and loan brokerage services',
      companies: ['Ellie Mae', 'ICE Mortgage Tech'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 13,
      rank: 13,
      niche: 'Mid-Market Manufacturing Firms',
      description: 'Medium-sized manufacturing operations',
      companies: ['Infor', 'Epicor'],
      revenuePotential: 'Yes',
      easyToTarget: 4,
      marketSophistication: 4,
      cagr: '10–14%'
    },
    {
      key: 14,
      rank: 14,
      niche: 'Staffing & Recruiting Agencies',
      description: 'Employment placement and recruiting services',
      companies: ['Bullhorn', 'Randstad'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 4,
      cagr: '12–18%'
    },
    {
      key: 15,
      rank: 15,
      niche: 'Independent Educational Services',
      description: 'Private educational and tutoring services',
      companies: ['Sylvan Learning', 'Local Tutoring'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 3,
      cagr: '12–16%'
    },
    {
      key: 16,
      rank: 16,
      niche: 'Elder Care & Assisted Living',
      description: 'Senior care and assisted living facilities',
      companies: ['Brookdale', 'Local Operators'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 17,
      rank: 17,
      niche: 'Veterinary Practices',
      description: 'Animal healthcare services',
      companies: ['Covetrus', 'ezyVet'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '8–12%'
    },
    {
      key: 18,
      rank: 18,
      niche: 'Fitness & Wellness Studios',
      description: 'Fitness centers and wellness services',
      companies: ['MindBody', 'Orangetheory'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '9–12%'
    },
    {
      key: 19,
      rank: 19,
      niche: 'Travel Agencies & Boutique Ops',
      description: 'Travel planning and booking services',
      companies: ['Amex Travel', 'Local Shops'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 2,
      cagr: '6–9%'
    },
    {
      key: 20,
      rank: 20,
      niche: 'Event Management Firms',
      description: 'Event planning and coordination services',
      companies: ['Cvent', 'Local Planners'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 3,
      cagr: '10–14%'
    },
    {
      key: 21,
      rank: 21,
      niche: 'Landscaping & Outdoor Services',
      description: 'Landscaping and outdoor maintenance services',
      companies: ['BrightView', 'Local SMBs'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '7–10%'
    },
    {
      key: 22,
      rank: 22,
      niche: 'Restaurants & Food Service Chains',
      description: 'Food service establishments',
      companies: ['Toast', 'Local SMBs'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 23,
      rank: 23,
      niche: 'Hospitality & Boutique Hotels',
      description: 'Lodging and hospitality services',
      companies: ['Independent Operators'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '7–11%'
    },
    {
      key: 24,
      rank: 24,
      niche: 'Cleaning & Janitorial Services',
      description: 'Commercial and residential cleaning services',
      companies: ['Jani-King', 'Local Franchises'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '6–9%'
    },
    {
      key: 25,
      rank: 25,
      niche: 'Childcare & Early Education',
      description: 'Childcare and early education services',
      companies: ['Primrose', 'Local Montessori'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 26,
      rank: 26,
      niche: 'Real Estate Brokerages',
      description: 'Real estate sales and brokerage services',
      companies: ['Keller Williams', 'Local Agencies'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 4,
      cagr: '7–10%'
    },
    {
      key: 27,
      rank: 27,
      niche: 'Funeral Homes & Crematories',
      description: 'Funeral and memorial services',
      companies: ['Service Corp Intl', 'Local Operators'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '6–9%'
    },
    {
      key: 28,
      rank: 28,
      niche: 'Printing & Signage Shops',
      description: 'Printing and signage services',
      companies: ['AlphaGraphics', 'Local Print Shops'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '6–8%'
    },
    {
      key: 29,
      rank: 29,
      niche: 'Security Guard Services',
      description: 'Security and guard services',
      companies: ['Allied Universal', 'Local Firms'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '7–9%'
    },
    {
      key: 30,
      rank: 30,
      niche: 'Transportation & School Bus Cos',
      description: 'Transportation and school bus services',
      companies: ['First Student', 'Local Operators'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '6–9%'
    },
    {
      key: 31,
      rank: 31,
      niche: 'Retail Boutiques & Shops',
      description: 'Specialty retail stores',
      companies: ['Independent Stores'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 32,
      rank: 32,
      niche: 'Pharmacies (Independent)',
      description: 'Independent pharmacy services',
      companies: ['Good Neighbor Pharmacy'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '7–10%'
    },
    {
      key: 33,
      rank: 33,
      niche: 'Dentistry Practices',
      description: 'Dental care services',
      companies: ['Aspen Dental', 'Local Clinics'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 3,
      cagr: '7–10%'
    },
    {
      key: 34,
      rank: 34,
      niche: 'Chiropractic Clinics',
      description: 'Chiropractic care services',
      companies: ['The Joint', 'Local Practices'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '8–12%'
    },
    {
      key: 35,
      rank: 35,
      niche: 'Optometry Clinics',
      description: 'Eye care and vision services',
      companies: ['America\'s Best', 'Local Clinics'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '7–10%'
    },
    {
      key: 36,
      rank: 36,
      niche: 'Mental Health Practices',
      description: 'Mental health and therapy services',
      companies: ['Talkspace', 'Local Clinics'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '9–13%'
    },
    {
      key: 37,
      rank: 37,
      niche: 'Accounting & Bookkeeping Firms',
      description: 'Financial and accounting services',
      companies: ['H&R Block', 'Local SMBs'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 4,
      cagr: '7–11%'
    },
    {
      key: 38,
      rank: 38,
      niche: 'Architecture & Design Firms',
      description: 'Architectural and design services',
      companies: ['Gensler', 'Local Studios'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 39,
      rank: 39,
      niche: 'Marketing Agencies (SMB)',
      description: 'Marketing and advertising services for small businesses',
      companies: ['Local SEO', 'Creative Shops'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 4,
      cagr: '9–12%'
    },
    {
      key: 40,
      rank: 40,
      niche: 'Elder Care Home Services',
      description: 'In-home elder care services',
      companies: ['Home Instead', 'Local Operators'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 41,
      rank: 41,
      niche: 'HR Consulting & Small Firms',
      description: 'Human resources consulting services',
      companies: ['Insperity', 'Local Firms'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '8–12%'
    },
    {
      key: 42,
      rank: 42,
      niche: 'Personal Coaching / Life Coaching',
      description: 'Personal and life coaching services',
      companies: ['Independent Coaches'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '10–15%'
    },
    {
      key: 43,
      rank: 43,
      niche: 'Wedding & Event Photography',
      description: 'Photography services for events and weddings',
      companies: ['Local Studios'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '6–9%'
    },
    {
      key: 44,
      rank: 44,
      niche: 'Catering Services',
      description: 'Food catering services',
      companies: ['Aramark', 'Local Caterers'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '6–9%'
    },
    {
      key: 45,
      rank: 45,
      niche: 'Roofing & Contracting Services',
      description: 'Roofing and general contracting services',
      companies: ['Local SMBs'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 2,
      cagr: '7–10%'
    },
    {
      key: 46,
      rank: 46,
      niche: 'Land Title & Escrow Services',
      description: 'Real estate title and escrow services',
      companies: ['First American', 'Local Firms'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '6–9%'
    },
    {
      key: 47,
      rank: 47,
      niche: 'Local Retail Pharmacies',
      description: 'Local pharmacy retail services',
      companies: ['Independent Pharmacies'],
      revenuePotential: 'Yes',
      easyToTarget: 3,
      marketSophistication: 3,
      cagr: '6–9%'
    },
    {
      key: 48,
      rank: 48,
      niche: 'Dentistry Practices',
      description: 'Dental care services',
      companies: ['Aspen Dental', 'Local Clinics'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 3,
      cagr: '7–10%'
    },
    {
      key: 49,
      rank: 49,
      niche: 'Chiropractic Clinics',
      description: 'Chiropractic care services',
      companies: ['The Joint', 'Local Practices'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '8–12%'
    },
    {
      key: 50,
      rank: 50,
      niche: 'Optometry Clinics',
      description: 'Eye care and vision services',
      companies: ['America\'s Best', 'Local Clinics'],
      revenuePotential: 'Yes',
      easyToTarget: 2,
      marketSophistication: 2,
      cagr: '7–10%'
    },
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