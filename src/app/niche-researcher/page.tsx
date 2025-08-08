"use client";

// app/niche-researcher/page.tsx
import React, { useState } from 'react';
import { Button, Card, Form, Input, Select, Typography, Divider, Progress, Tag } from 'antd';
import { 
  UserOutlined, 
  SolutionOutlined, 
  StarOutlined, 
  HeartOutlined, 
  TeamOutlined, 
  BulbOutlined, 
  ClockCircleOutlined, 
  DollarOutlined, 
  EnvironmentOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const NicheResearcher = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const steps = [
    'Professional Background',
    'Personal Interests & Network',
    'Market Insights & Constraints',
    'Generate Report'
  ];

  const onFinish = (values: any) => {
    // Simulate report generation
    const mockReport = {
      recommendedNiches: [
        {
          name: "AI-Powered Career Coaching",
          matchScore: 92,
          reasons: [
            "Aligns with your HR tech background",
            "Leverages your interest in personal development",
            "Low startup costs with high scalability"
          ],
          marketSize: "$2.5B growing at 18% CAGR",
          competition: "Moderate (3/5)",
          resourcesNeeded: [
            "Basic AI tool subscriptions",
            "Networking with career coaches",
            "Content creation setup"
          ]
        },
        {
          name: "Sustainable Office Solutions",
          matchScore: 85,
          reasons: [
            "Combines your operations experience with eco-interests",
            "Growing corporate sustainability demands",
            "Your connections in commercial real estate"
          ],
          marketSize: "$4.1B growing at 12% CAGR",
          competition: "Low (2/5)",
          resourcesNeeded: [
            "Supplier partnerships",
            "Eco-certifications",
            "B2B marketing materials"
          ]
        }
      ],
      monetizationStrategies: [
        "Subscription-based consulting",
        "Affiliate partnerships with tool providers",
        "Corporate workshop packages"
      ],
      potentialChallenges: [
        "Regulatory changes in HR tech",
        "Client acquisition in early stages",
        "Balancing customization with scalability"
      ],
      nextSteps: [
        "Validate with 5 target customer interviews",
        "Create MVP service offering",
        "Leverage 2 key connections for introductions"
      ]
    };
    
    setReportData(mockReport);
    setReportGenerated(true);
    setCurrentStep(3);
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <SolutionOutlined className="mr-2" />
                Professional Experience
              </Title>
              <Form.Item
                name="roles"
                label="Describe your past roles and industries"
              >
                <TextArea rows={4} placeholder="e.g. 5 years in HR tech, operations manager at SaaS company..." />
              </Form.Item>
              
              <Form.Item
                name="skills"
                label="List your strongest skills (select up to 5)"
              >
                <Select
                  mode="multiple"
                  placeholder="Select skills"
                  options={[
                    { value: 'project-management', label: 'Project Management' },
                    { value: 'sales', label: 'Sales' },
                    { value: 'marketing', label: 'Marketing' },
                    { value: 'data-analysis', label: 'Data Analysis' },
                    { value: 'product-development', label: 'Product Development' },
                  ]}
                />
              </Form.Item>
            </Card>
            
            <Card>
              <Title level={4} className="flex items-center">
                <StarOutlined className="mr-2" />
                Core Competencies
              </Title>
              <Form.Item
                name="competencies"
                label="What unique value can you offer that others can't?"
              >
                <TextArea rows={3} placeholder="e.g. Deep understanding of HR pain points, technical + business background..." />
              </Form.Item>
            </Card>
          </>
        );
      case 1:
        return (
          <>
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <HeartOutlined className="mr-2" />
                Personal Passions
              </Title>
              <Form.Item
                name="interests"
                label="What are you genuinely interested in outside of work?"
              >
                <TextArea rows={3} placeholder="e.g. Sustainability, personal development, AI applications..." />
              </Form.Item>
            </Card>
            
            <Card>
              <Title level={4} className="flex items-center">
                <TeamOutlined className="mr-2" />
                Strategic Network
              </Title>
              <Form.Item
                name="connections"
                label="Who do you know in specific industries? (Name or describe)"
              >
                <TextArea rows={3} placeholder="e.g. Commercial real estate broker friend, mentor in SaaS space..." />
              </Form.Item>
              
              <Form.Item
                name="audienceAccess"
                label="Do you have access to any specific audience groups?"
              >
                <Input placeholder="e.g. 500 LinkedIn connections in tech, local business owner group..." />
              </Form.Item>
            </Card>
          </>
        );
      case 2:
        return (
          <>
            <Card className="mb-6">
              <Title level={4} className="flex items-center">
                <BulbOutlined className="mr-2" />
                Market Opportunities
              </Title>
              <Form.Item
                name="problems"
                label="What problems have you noticed businesses or people facing?"
              >
                <TextArea rows={4} placeholder="e.g. HR teams struggling with remote onboarding, small businesses lacking affordable automation..." />
              </Form.Item>
              
              <Form.Item
                name="trends"
                label="What emerging trends excite you?"
              >
                <TextArea rows={3} placeholder="e.g. AI democratization, sustainable business practices..." />
              </Form.Item>
            </Card>
            
            <Card>
              <Title level={4} className="flex items-center">
                <FileTextOutlined className="mr-2" />
                Personal Constraints
              </Title>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Form.Item
                  name="time"
                  label={<span><ClockCircleOutlined className="mr-1" /> Weekly Hours Available</span>}
                >
                  <Select placeholder="Select">
                    <Option value="5-10">5-10 hours</Option>
                    <Option value="10-20">10-20 hours</Option>
                    <Option value="20-30">20-30 hours</Option>
                    <Option value="30+">30+ hours</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="budget"
                  label={<span><DollarOutlined className="mr-1" /> Startup Budget</span>}
                >
                  <Select placeholder="Select">
                    <Option value="0-1k">$0-$1,000</Option>
                    <Option value="1k-5k">$1k-$5k</Option>
                    <Option value="5k-10k">$5k-$10k</Option>
                    <Option value="10k+">$10k+</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="location"
                  label={<span><EnvironmentOutlined className="mr-1" /> Location Flexibility</span>}
                >
                  <Select placeholder="Select">
                    <Option value="remote-only">Fully remote</Option>
                    <Option value="local-focused">Local market focus</Option>
                    <Option value="hybrid">Hybrid options</Option>
                  </Select>
                </Form.Item>
              </div>
              
              <Form.Item
                name="otherConstraints"
                label="Any other limitations or requirements?"
              >
                <TextArea rows={2} placeholder="e.g. Must be family-friendly schedule, need health insurance coverage..." />
              </Form.Item>
            </Card>
          </>
        );
      case 3:
        return (
          <div className="report-container">
            {reportGenerated ? (
              <>
                <Card className="mb-6">
                  <div className="text-center mb-6">
                    <Title level={3}>Your Personalized Niche Report</Title>
                    <Text type="secondary">Generated based on your unique profile</Text>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {reportData.recommendedNiches.map((niche: any, index: number) => (
                      <Card 
                        key={index} 
                        title={
                          <div className="flex justify-between items-center">
                            <span>{niche.name}</span>
                            <Tag color={niche.matchScore > 85 ? 'green' : 'blue'}>
                              Match: {niche.matchScore}%
                            </Tag>
                          </div>
                        }
                        className="h-full"
                      >
                        <div className="space-y-4">
                          <div>
                            <Text strong>Why This Fits You:</Text>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              {niche.reasons.map((reason: string, i: number) => (
                                <li key={i}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Text strong>Market Size:</Text>
                              <div>{niche.marketSize}</div>
                            </div>
                            <div>
                              <Text strong>Competition:</Text>
                              <div>{niche.competition}</div>
                            </div>
                          </div>
                          
                          <div>
                            <Text strong>Resources Needed:</Text>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {niche.resourcesNeeded.map((resource: string, i: number) => (
                                <Tag key={i}>{resource}</Tag>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  <Divider />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Monetization Strategies">
                      <ul className="list-disc pl-5 space-y-2">
                        {reportData.monetizationStrategies.map((strategy: string, i: number) => (
                          <li key={i}>{strategy}</li>
                        ))}
                      </ul>
                    </Card>
                    
                    <Card title="Potential Challenges">
                      <ul className="list-disc pl-5 space-y-2">
                        {reportData.potentialChallenges.map((challenge: string, i: number) => (
                          <li key={i}>{challenge}</li>
                        ))}
                      </ul>
                    </Card>
                    
                    <Card title="Recommended Next Steps">
                      <ul className="list-disc pl-5 space-y-2">
                        {reportData.nextSteps.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </Card>
                
                <div className="text-center">
                  <Button type="primary" size="large">
                    Download Full Report (PDF)
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <Title level={4}>Ready to Generate Your Niche Report</Title>
                <Text type="secondary">Review your information and click below to analyze</Text>
                <div className="mt-6">
                  <Button type="primary" size="large" onClick={() => form.submit()}>
                    Generate Niche Research Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Title level={2} className="text-center mb-2">
        <UserOutlined className="mr-2" />
        Niche Researcher
      </Title>
      <Text type="secondary" className="block text-center mb-8">
        Discover your perfect business niche based on your unique background, skills, and market opportunities
      </Text>
      
      <div className="mb-8">
        <Progress 
          percent={(currentStep / (steps.length - 1)) * 100} 
          showInfo={false} 
          strokeColor="#1890ff"
        />
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`text-sm ${currentStep >= index ? 'font-medium text-blue-600' : 'text-gray-400'}`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
       className="dark:bg-white-900 rounded-lg"

      >
        {renderStepContent()}
        
   <div className="flex justify-between mt-8 pb-8 px-4">
          {currentStep > 0 && (
            <Button onClick={prevStep}>
              Back
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={nextStep}>
              Continue
            </Button>
          ) : !reportGenerated ? (
            <Button type="primary" onClick={() => form.submit()}>
              Download Report
            </Button>
          ) : null}
        </div>
      </Form>
    </div>
  );
};

export default NicheResearcher;