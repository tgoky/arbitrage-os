// app/n8n-library/show/[id]/page.tsx
"use client";

import { 
  DownloadOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Typography, 
  Tag, 
  Divider, 
  Row, 
  Col,
  Steps,
  Card,
  Space,
  Collapse,
  List,
  Avatar,
  Progress
} from 'antd';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Image from "next/image";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

// Import your workflow details
import { workflowDetails } from '../../libs/libs';

const WorkflowDetail = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const workflowId = id ? parseInt(id) : 1;
  const workflow = workflowDetails.find(w => w.id === workflowId) || workflowDetails[0];

  const downloadWorkflow = () => {
    const blob = new Blob([JSON.stringify(workflow.jsonTemplate, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8  min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/n8n-library')}
          className="mb-4 flex items-center"
        >
          Back to Library
        </Button>
      </div>

      {/* Main Content */}
      <div className=" rounded-xl shadow-lg p-6 mb-6">
        {/* Title and Action Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Title level={1} className="!mb-0 !text-3xl">{workflow.title}</Title>
              {workflow.featured && (
                <Tag color="gold" icon={<ThunderboltOutlined />} className="!text-sm !py-1">
                  Featured
                </Tag>
              )}
            </div>
            <Text type="secondary" className="text-lg block mb-4">
              {workflow.description}
            </Text>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-gray-400" />
                <Text className="text-sm">{workflow.setupTime}</Text>
              </div>
              <div className="flex items-center gap-2">
                <StarOutlined className="text-gray-400" />
                <Text className="text-sm">{workflow.difficulty}</Text>
              </div>
              <div className="flex items-center gap-2">
                <DownloadOutlined className="text-gray-400" />
                <Text className="text-sm">{workflow.downloads}+ downloads</Text>
              </div>
            </div>

            {/* Tags */}
            <Space size={[0, 8]} wrap>
              {workflow.tags.map((tag, i) => (
                <Tag key={i} color="blue" className="!m-0 !mb-2">
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>

          <Button 
            type="primary" 
            size="large" 
            icon={<DownloadOutlined />}
            onClick={downloadWorkflow}
            className="!h-12 !px-6 !text-base"
          >
            Download Template
          </Button>
        </div>

        <Divider />

        {/* Main Content Grid */}
        <Row gutter={[32, 32]}>
          {/* Left Column - Content */}
          <Col xs={24} lg={16}>
            {/* Overview Section */}
            <section className="mb-8">
              <Title level={3} className="!mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                Overview
              </Title>
              <div className=" rounded-lg p-6">
                <Paragraph className="!mb-0  leading-7">
                  {workflow.overview.split('\n').map((paragraph, i) => (
                    <span key={i}>
                      {paragraph}
                      <br /><br />
                    </span>
                  ))}
                </Paragraph>
              </div>
            </section>

            {/* Use Case Section */}
            <section className="mb-8">
              <Title level={3} className="!mb-4 flex items-center gap-2">
                <div className="w-2 h-6 bg-green-500 rounded-full"></div>
                Use Case
              </Title>
              <Card className="!border-0 !shadow-md">
                <Paragraph className="!mb-0  text-base">
                  {workflow.useCase}
                </Paragraph>
              </Card>
            </section>

            {/* Video Tutorial Section */}
         
            {workflow.videoTutorial && (
              <>
                <Title level={3}>N8N Workflow Diagram</Title>
                <div className="aspect-video mb-6">
                 <Image
        src={`https://drive.google.com/uc?export=view&id=${workflow.videoTutorial.split("/d/")[1].split("/")[0]}`}
        alt="Tutorial preview"
        width={800}
        height={600}
        className="rounded-lg"
      />
                </div>
              </>
            )}


            {/* Key Benefits Section */}
            <section className="mb-8">
              <Title level={3} className="!mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-purple-500 rounded-full"></div>
                Key Benefits
              </Title>
              <Row gutter={[16, 16]}>
                {workflow.keyBenefits.map((benefit, i) => (
                  <Col xs={24} md={12} key={i}>
                    <Card className="!border-0 !shadow-sm !h-full hover:!shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Text strong className="!text-blue-600 !text-sm">
                            {i + 1}
                          </Text>
                        </div>
                        <Text>{benefit}</Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </section>

            {/* Setup Instructions Section */}
            <section className="mb-8">
              <Title level={3} className="!mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                Setup Instructions
              </Title>
              
              <div className=" rounded-lg border">
                <Steps 
                  direction="vertical" 
                  size="default" 
                  current={workflow.setupInstructions.length}
                  className="p-6"
                >
                  {workflow.setupInstructions.map((instruction, index) => (
                    <Step
                      key={instruction.step}
                      title={
                        <Text strong className="!text-lg">
                          Step {instruction.step}: {instruction.title}
                        </Text>
                      }
                      description={
                        <div className="mt-3">
                          <Paragraph className=" !mb-4 leading-6">
                            {instruction.description}
                          </Paragraph>
                          {instruction.screenshot && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                              <div className="text-sm text-gray-500 mb-2 font-medium">Screenshot Reference:</div>
                              <div className="bg-gray-200 h-48 rounded flex items-center justify-center">
                                <div className="text-center">
                                  <Text type="secondary" className="block mb-2">
                                    Screenshot placeholder
                                  </Text>
                                  <Text type="secondary" className="text-xs">
                                    Actual screenshot would appear here
                                  </Text>
                                </div>
                              </div>
                            </div>
                          )}
                          {index < workflow.setupInstructions.length - 1 && (
                            <Divider className="!my-6" />
                          )}
                        </div>
                      }
                    />
                  ))}
                </Steps>
              </div>
            </section>
          </Col>

          {/* Right Column - Sidebar */}
          <Col xs={24} lg={8}>
            {/* Quick Actions Card */}
            <Card 
              title="Quick Actions" 
              className="!mb-6 !border-0 !shadow-lg"
              extra={<DownloadOutlined className="text-gray-400" />}
            >
              <Space direction="vertical" className="w-full">
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<DownloadOutlined />}
                  onClick={downloadWorkflow}
                  block
                  className="!h-12 !text-base"
                >
                  Download Template
                </Button>
                <Button 
                  type="default" 
                  size="large"
                  block
                  className="!h-10"
                >
                  Save to Favorites
                </Button>
              </Space>
            </Card>

            {/* Workflow Details Card */}
            <Card 
              title="Workflow Details" 
              className="!mb-6 !border-0 !shadow-lg"
            >
              <Space direction="vertical" size="middle" className="w-full">
                {/* Requirements */}
                <div>
                  <Text strong className="block mb-2 text-gray-700">Requirements</Text>
                  <Space size={[0, 8]} wrap>
                    {workflow.requirements.map((req, i) => (
                      <Tag key={i} color="blue" className="!m-0 !mb-2">
                        {req}
                      </Tag>
                    ))}
                  </Space>
                </div>

                {/* Integrations */}
                <div>
                  <Text strong className="block mb-2 text-gray-700">Integrations</Text>
                  <Space size={[0, 8]} wrap>
                    {workflow.integrations.map((integration, i) => (
                      <Tag key={i} color="green" className="!m-0 !mb-2">
                        {integration}
                      </Tag>
                    ))}
                  </Space>
                </div>

                {/* Workflow Nodes */}
                <div>
                  <Text strong className="block mb-2 text-gray-700">Workflow Nodes</Text>
                  <Space size={[0, 8]} wrap>
                    {workflow.workflowNodes.map((node, i) => (
                      <Tag key={i} color="purple" className="!m-0 !mb-2">
                        {node}
                      </Tag>
                    ))}
                  </Space>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <Text strong className="block text-gray-700">Setup Time</Text>
                    <Text className="text-lg font-semibold text-blue-600">{workflow.setupTime}</Text>
                  </div>
                  <div className="text-center">
                    <Text strong className="block text-gray-700">Difficulty</Text>
                    <Text className="text-lg font-semibold text-green-600">{workflow.difficulty}</Text>
                  </div>
                </div>
              </Space>
            </Card>

            {/* Popularity Card */}
            <Card 
              title="Popularity" 
              className="!border-0 !shadow-lg"
            >
              <div className="text-center">
                <div className="mb-4">
                  <Progress 
                    type="circle" 
                    percent={Math.min(100, (workflow.downloads / 200) * 100)} 
                    size={80}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
                <Text strong className="block text-gray-700 mb-1">
                  {workflow.downloads}+ Downloads
                </Text>
                <Text type="secondary" className="text-sm">
                  One of our most popular templates
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default WorkflowDetail;